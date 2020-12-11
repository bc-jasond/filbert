import { OAuth2Client } from 'google-auth-library';

import { getKnex } from '../lib/mysql.mjs';
import { checkPassword } from '../lib/admin.mjs';

function sendLoggedInUser(req, res, user) {
  const loggedInUser = {
    username: user.username,
    userId: user.id,
    givenName: user.given_name,
    familyName: user.family_name,
    pictureUrl: user.picture_url,
    created: user.created,
    iss: user.iss,
  };
  req.session.user = loggedInUser;
  req.session.preferences = user?.meta?.preferences;
  res.send(loggedInUser);
}

export async function postSignin(req, res) {
  try {
    const knex = await getKnex();
    const { username, password } = req.body;
    const [user] = await knex('user').where('username', username);

    if (!user) {
      res.status(401).send({ error: 'Invalid credentials' });
      return;
    }

    const passwordDoesMatch = await checkPassword(password, user.password);

    if (!passwordDoesMatch) {
      res.status(401).send({ error: 'Invalid credentials' });
      return;
    }

    const exp = Date.now() / 1000 + 60 * 60 * 24; // 24 hours
    sendLoggedInUser(req, res, { ...user, exp });
  } catch (err) {
    console.error('Signin Error: ', err);
    res.status(401).send({});
  }
}

export async function postSigninGoogle(req, res) {
  try {
    const {
      body: { googleUser: { idToken } = {}, filbertUsername } = {},
    } = req;
    const client = new OAuth2Client(process.env.GOOGLE_API_FILBERT_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_API_FILBERT_CLIENT_ID,
    });
    // LoginTicket api/node_modules/google-auth-library/build/src/auth/loginticket.d.ts
    const {
      email,
      given_name,
      family_name,
      picture,
      iss,
      exp,
    } = ticket.getPayload();

    const knex = await getKnex();
    let [user] = await knex('user').where('email', email);
    // TODO: update filbert db if any values are different
    if (user) {
      sendLoggedInUser(req, res, { ...user, exp });
      return;
    }

    if (!user && !filbertUsername) {
      // this is a signup, prompt for a username
      res.send({ signupIsIncomplete: true });
      return;
    }

    if (
      filbertUsername.length < 5 ||
      filbertUsername.length > 42 ||
      RegExp(/[^0-9a-z]/g).test(filbertUsername)
    ) {
      res.status(400).send({
        error: `Invalid Username: ${filbertUsername} - Pick a username with at least 5 to 42 characters in length with only lowercase letters and numbers.  No spaces, special characters or emojis or anything of that nature.`,
      });
      return;
    }

    [user] = await knex('user').where('username', filbertUsername);
    if (user) {
      res.status(400).send({
        error: `Invalid Username: ${filbertUsername} - It's already taken!`,
      });
      return;
    }

    // we're back and user entered username, try to create a new user record and signin
    const [userId] = await knex
      .insert({
        email,
        username: filbertUsername,
        given_name,
        family_name,
        picture_url: picture,
        iss,
      })
      .into('user');

    [user] = await knex('user').where('id', userId);

    sendLoggedInUser(req, res, { ...user, exp });
  } catch (err) {
    console.error('Signin Error: ', err);
    res.status(401).send({});
  }
}

export async function postSignout(req, res) {
  console.log('signout', req.session.id, req.session);
  req.session.destroy(() => {
    res.send({});
  });
}
