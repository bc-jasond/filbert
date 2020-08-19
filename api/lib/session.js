function sendSession(req, res, user) {
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
  req.session.isSignedIn = true;
  res.send(loggedInUser);
}

function syncUserProfileFromGoogle() {}

module.exports = {
  sendSession,
};
