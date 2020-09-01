import * as sapper from '@sapper/app';

import { GoogleAuth } from './stores';
import { googleAuth } from './common/google-auth';

googleAuth()
  .then((auth) => {
    GoogleAuth.set(auth);
  })
  .catch((err) => console.error(err));

sapper.start({
  target: document.querySelector('#sapper'),
});
