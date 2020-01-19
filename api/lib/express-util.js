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

module.exports = {
  sendSession
};
