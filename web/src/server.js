import * as sapper from '@sapper/server';
import compression from 'compression';
import polka from 'polka';
import sirv from 'sirv';

import session from 'express-session';
import mysqlSession from 'express-mysql-session';

import {
  saneEnvironmentOrExit,
  success,
  info,
  error,
  log,
} from '@filbert/util';
import {
  FILBERT_SESSION_COOKIE_NAME,
  ENCRYPTION_KEY,
} from '@filbert/constants';
import { mysqlConnectionConfig } from '@filbert/mysql';

saneEnvironmentOrExit('NODE_ENV', 'MYSQL_ROOT_PASSWORD', 'ENCRYPTION_KEY');

const MysqlStore = mysqlSession(session);
const sessionStore = new MysqlStore(mysqlConnectionConfig);

const { PORT, NODE_ENV } = process.env;
const isProduction = NODE_ENV === 'production';

// from figlet
const welcomeMessage = `
__          ________ ____  
\\ \\        / /  ____|  _ \\ 
 \\ \\  /\\  / /| |__  | |_) |
  \\ \\/  \\/ / |  __| |  _ < 
   \\  /\\  /  | |____| |_) |
    \\/  \\/   |______|____/ \n\n`;
info(welcomeMessage);
info('NODE_ENV', process.env.NODE_ENV);

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev: !isProduction }),
    // TODO: centralize this to coordinate with filbert-api.js
    session({
      key: FILBERT_SESSION_COOKIE_NAME,
      secret: ENCRYPTION_KEY,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        secure: isProduction,
        domain: isProduction ? '.filbert.xyz' : '',
      },
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
          req.session.id,
          `TTL in seconds: ${Math.floor(req.session.cookie.maxAge / 1000)}`,
          req.session,
          req.headers.cookie
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
