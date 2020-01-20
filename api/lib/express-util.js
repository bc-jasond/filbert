const { encrypt } = require("./cipher");

function sendSession(res, user) {
  res.send({
    token: encrypt(JSON.stringify(user)),
    session: {
      username: user.username,
      userId: user.id,
      givenName: user.given_name,
      familyName: user.family_name,
      pictureUrl: user.picture_url,
      created: user.created,
      iss: user.iss
    }
  });
}

// forward middleware errors to a global handler
const wrapMiddleware = fn => (...args) =>
  fn(...args).catch(args[2] /* the next() callback */);

module.exports = {
  sendSession,
  wrapMiddleware
};
