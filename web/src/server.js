// ESM - remove after ECMAScript Module support is past Experimental - node v14 ?
require = require('esm')(module /*, options*/);

import * as sapper from '@sapper/server';
import compression from 'compression';
import polka from 'polka';
import sirv from 'sirv';

const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);

const { saneEnvironmentOrExit, success, info, error, log } = require('@filbert/util')
const {
  FILBERT_SESSION_COOKIE_NAME,
  ENCRYPTION_KEY,
} = require('@filbert/constants');
const { mysqlConnectionConfig } = require('@filbert/mysql');

const sessionStore = new MysqlStore(mysqlConnectionConfig);

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

saneEnvironmentOrExit(
    'MYSQL_ROOT_PASSWORD',
    'ENCRYPTION_KEY',
);

// from figlet
const welcomeMessage = `
__          ________ ____  
\\ \\        / /  ____|  _ \\ 
 \\ \\  /\\  / /| |__  | |_) |
  \\ \\/  \\/ / |  __| |  _ < 
   \\  /\\  /  | |____| |_) |
    \\/  \\/   |______|____/ \n\n`;
info(welcomeMessage);
info("NODE_ENV", process.env.NODE_ENV)

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    session({
      key: FILBERT_SESSION_COOKIE_NAME,
      secret: ENCRYPTION_KEY,
      store: sessionStore,
      rolling: true,
      resave: false,
      saveUninitialized: false,
    }),
    // until sapper supports arbitrary "replacers" https://github.com/sveltejs/sapper/pull/1152
    // HTML (template.html) gets string replacement using this express middleware to read preferences from req.session.preferences during SSR
    function (req, res, next) {
      let resEnd = res.end;

      res.end = function (...args) {
        let [body] = args;

        if (typeof body === 'string') {
          const bodyClasses = [];
          if (req.session?.preferences?.theme === 'dark') {
            bodyClasses.push('dark');
          }
          if (req.session?.preferences?.font === 'sans') {
            bodyClasses.push('sans');
          }
          body = body.replace('%filbertBodyClasses%', bodyClasses.join(' '));
        }
        resEnd.call(res, body);
      };

      next();
    },
    sapper.middleware({
      session: (req, res) => {
        log(
          'SAPPER server middleware',
          ENCRYPTION_KEY,
          req.session.id,
          `TTL in seconds: ${Math.floor(req.session.cookie.maxAge / 1000)}`,
          req.session,
          req.headers.cookie &&
            req.headers.cookie
              .split(';')
              .filter((c) => c.includes(FILBERT_SESSION_COOKIE_NAME))
        );
        // devalue doesn't like Session(), so stripping it before serialization
        return JSON.parse(JSON.stringify(req.session || {}));
      },
    })
  )
  .listen(PORT, (err) => {
    if (err) error(err);
  });

success('Filbert WEB Started 👍');
