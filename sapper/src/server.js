import * as sapper from '@sapper/server';
import compression from 'compression';
import polka from 'polka';
import sirv from 'sirv';

const session = require('express-session');
const MysqlStore = require('express-mysql-session')(session);
const {
  FILBERT_SESSION_COOKIE_NAME,
  ENCRYPTION_KEY,
  mysqlConnectionConfig,
} = require('@filbert/lib');

const sessionStore = new MysqlStore(mysqlConnectionConfig);

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    session({
      key: FILBERT_SESSION_COOKIE_NAME,
      secret: ENCRYPTION_KEY,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
    }),
    sapper.middleware({
      session: (req, res) => {
        console.log("SAPPER", ENCRYPTION_KEY, req.session.id, req.session, req.headers.cookie.split(';').filter(c => c.includes(FILBERT_SESSION_COOKIE_NAME)));
        // devalue doesn't like Session(), so stripping it before serialization
        return JSON.parse(JSON.stringify(req.session || {}));
      },
    })
  )
  .listen(PORT, (err) => {
    if (err) console.log('error', err);
  });
