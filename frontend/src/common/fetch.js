import { API_URL, AUTH_TOKEN_KEY, SESSION_KEY } from './constants';
import { get, set } from './local-storage';
import { getGoogleUser, googleGetLoggedInUser } from './google-auth';

function getBaseConfig() {
  return {
    // Default options are marked with *
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
      Authorization: get(AUTH_TOKEN_KEY)
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer' // no-referrer, *client
  };
}

async function handleResponse(res) {
  const data = res?.status === 204 ? {} : await res.json();
  // TODO: string parsing for 2XX level status code!
  // TODO: don't use throw for control flow.  Return the whole response and let the client figure it out
  if (res.status.toString().charAt(0) !== '2') {
    throw new Error(`${res.status} ${res.statusText}\n${JSON.stringify(data)}`);
  }
  Pace.stop();
  return data;
}

export async function signinGoogle(googleUser, filbertUsername) {
  try {
    Pace.start();
    const config = getBaseConfig();
    delete config.headers.Authorization;
    config.method = 'POST';
    config.body = JSON.stringify({ googleUser, filbertUsername }); // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}/signin-google`, config);
    const { signupIsIncomplete, token, session } = await handleResponse(
      response
    );
    if (signupIsIncomplete) {
      return { signupIsIncomplete };
    }
    set(AUTH_TOKEN_KEY, token, false);
    set(SESSION_KEY, session, false);
    return { signupIsIncomplete: false };
  } catch (err) {
    Pace.stop();
    console.error('Google Signin Error: ', err);
    throw err;
  }
}

async function fetchRefresh(url, config) {
  try {
    const res = await fetch(url, config);
    const data = await handleResponse(res);
    return data;
  } catch (err) {
    // retry once for 401 token expired
    if (!err.message.includes('expired token')) {
      throw err;
    }
    console.info('Retrying fetch...');
    const user = await googleGetLoggedInUser();
    let signupIsIncomplete;
    if (user) {
      ({ signupIsIncomplete } = await signinGoogle(getGoogleUser(user)));
      // !signupIsIncomplete means the signin succeeded!
      console.info('SUCCESS: Google Auth refresh');
    }
    if (!user || signupIsIncomplete) {
      window.location.href = `signin?next=${window.location.pathname}`;
    }
    // one retry
    // reset Authorization header
    const res2 = await fetch(url, {
      ...config,
      headers: { Authorization: get(AUTH_TOKEN_KEY) }
    });
    return handleResponse(res2);
  }
}

async function apiCall(method, url, data, config = getBaseConfig()) {
  try {
    Pace.start();
    const configInternal = { ...config };
    configInternal.method = method;
    if (data) {
      configInternal.body = JSON.stringify(data); // body data type must match "Content-Type" header
    }
    return fetchRefresh(`${API_URL}${url}`, configInternal);
  } catch (err) {
    Pace.stop();
    console.error(`Fetch ${method} Error: `, err);
    throw err;
  }
}

export async function apiGet(url) {
  return apiCall('GET', url);
}

export async function apiPost(url, data) {
  return apiCall('POST', url, data);
}

export async function apiPatch(url, data) {
  return apiCall('PATCH', url, data);
}

export async function apiDelete(url) {
  return apiCall('DELETE', url);
}

export async function uploadImage(formData) {
  const config = getBaseConfig();
  delete config.headers['Content-Type'];
  config.body = formData;
  return apiCall('POST', '/image', undefined, config);
}

export async function signin(username, password) {
  const { token, session } = await apiPost('/signin', { username, password });
  set(AUTH_TOKEN_KEY, token, false);
  set(SESSION_KEY, session, false);
  return { token, session };
}
