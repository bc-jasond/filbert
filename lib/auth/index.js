module.exports = {
  assertLoggedInUser: async function assertLoggedInUser(req, res, next) {
    if (!req.session.isSignedIn && !req.session.user) {
      console.error(
        'no loggedInUser found, stopping',
        req.method,
        req.url,
        req.headers
      );
      res.status(401).send({});
      return;
    }
    next();
  },
};
