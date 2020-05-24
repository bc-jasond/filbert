const { decrypt } = require('../lib/cipher');
/**
 * TODO: implement refresh_token hybrid frontend/server-side flow
 *  https://developers.google.com/identity/sign-in/web/server-side-flow
 *  only necessary if using Google APIs
 */
async function parseAuthorizationHeader(req, res, next) {
  try {
    const {
      headers: { authorization },
    } = req;
    // decrypt Authorization header
    // assign 'loggedInUser' session to req for all routes
    // TODO: json encoded string 'null'?
    if (
      typeof authorization === 'string' &&
      authorization.length > 0 &&
      !['null', 'undefined'].includes(authorization)
    ) {
      console.info(
        'Authorization Header: ',
        authorization,
        typeof authorization
      );
      const decryptedToken = JSON.parse(decrypt(authorization));
      const nowInSeconds = Math.floor(Date.now() / 1000);
      // uncomment below to auto-fail to test expired token flow
      //decryptedToken.exp = nowInSeconds;
      if (decryptedToken.exp - nowInSeconds <= 5 * 60 /* 5 minutes */) {
        // token expired if within 5 minutes of the 'exp' time
        res.status(401).send({ error: 'expired token' });
        return;
      }
      req.loggedInUser = decryptedToken;
    }
    //console.info("no Authorization header found.")
    next();
  } catch (err) {
    console.error('Authorization header Error, continuing anyway...', err);
    next();
  }
}

async function assertLoggedInUser(req, res, next) {
  if (!req.loggedInUser) {
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
}

module.exports = {
  parseAuthorizationHeader,
  assertLoggedInUser,
};
