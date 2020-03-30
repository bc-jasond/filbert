const { OAuth2Client } = require("google-auth-library");

const { getKnex } = require("../lib/mysql");
const { sendSession } = require("../lib/express-util");
const { checkPassword } = require("../lib/admin");

async function postSignin(req, res) {
  try {
    const knex = await getKnex();
    const { username, password } = req.body;
    const [user] = await knex("user").where("username", username);

    if (!user) {
      res.status(401).send({ error: "Invalid credentials" });
      return;
    }

    const passwordDoesMatch = await checkPassword(password, user.password);

    if (!passwordDoesMatch) {
      res.status(401).send({ error: "Invalid credentials" });
      return;
    }

    const exp = Date.now() / 1000 + 60 * 60 * 24; // 24 hours
    sendSession(res, { ...user, exp });
  } catch (err) {
    console.error("Signin Error: ", err);
    res.status(401).send({});
  }
}

async function postSigninGoogle(req, res) {
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
    let [user] = await knex("user").where("email", email);
    if (user) {
      sendSession(res, { ...user, exp });
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

    [user] = await knex("user").where("username", filbertUsername);
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
      .into("user");

    [user] = await knex("user").where("id", userId);

    sendSession(res, { ...user, exp });
  } catch (err) {
    console.error("Signin Error: ", err);
    res.status(401).send({});
  }
}

module.exports = {
  postSignin,
  postSigninGoogle,
};
