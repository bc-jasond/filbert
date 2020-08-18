import * as sapper from '@sapper/app';

import { getGoogleUser } from '../../frontend/src/common/google-auth';
import { GoogleAuth } from './stores';
import { loadScript } from './common/dom';

if (!window.gapi) {
  loadScript('https://apis.google.com/js/platform.js')
    .then(async function googleAuthInit() {
      await new Promise((resolve) => window.gapi.load('auth2', resolve));
      await window.gapi.auth2.init({
        client_id: process.env.GOOGLE_API_FILBERT_CLIENT_ID,
      });
      GoogleAuth.set(window.gapi.auth2.getAuthInstance());
    })
    .catch((err) => console.error(err));
}

sapper.start({
  target: document.querySelector('#sapper'),
});
