import * as sapper from '@sapper/server';
import compression from 'compression';
import polka from 'polka';
import sirv from 'sirv';

import { parseAuthorizationHeader } from '../../common/auth';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    parseAuthorizationHeader,
    sapper.middleware({
      session: (req, res) => ({
        user: req.loggedInUser,
      })
    })
  )
  .listen(PORT, err => {
    if (err) console.log('error', err);
  });
