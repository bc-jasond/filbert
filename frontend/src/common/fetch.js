import { API_URL } from './constants';
import { createNextUrl } from './dom';
import { getToken, signin } from './session';
import { getGoogleUser, googleGetLoggedInUser } from './google-auth';
import { loadingStart, loadingStop } from './use-loading.hook';

function getBaseConfig(abortSignal = null) {
  const config = {
    // Default options are marked with *
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
      Authorization: getToken(),
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
  };
  if (abortSignal) {
    config.signal = abortSignal;
  }
  return config;
}

async function handleResponse(res) {
  const data = res?.status === 204 ? {} : await res.json();
  // TODO: don't use throw for control flow.  Return the whole response and let the client figure it out
  if (res.status < 200 || res.status > 299) {
    return {
      error: { ...data, status: res.status, statusText: res.statusText },
    };
  }
  return { error: null, data };
}

export async function signinGoogle(googleUser, filbertUsername) {
  loadingStart();
  const config = getBaseConfig();
  delete config.headers.Authorization;
  config.method = 'POST';
  config.body = JSON.stringify({ googleUser, filbertUsername }); // body data type must match "Content-Type" header
  const response = await fetch(`${API_URL}/signin-google`, config);
  const { error, data } = await handleResponse(response);
  loadingStop();
  if (error) {
    console.error('Google Signin Error: ', error);
    return { error };
  }
  const { signupIsIncomplete, token, session } = data;
  if (signupIsIncomplete) {
    return { signupIsIncomplete };
  }
  signin(token, session);
  return { signupIsIncomplete: false };
}

async function fetchRefresh(url, config) {
  const res = await fetch(url, config);
  const data = await handleResponse(res);
  const { error } = data;
  if (!error || !error?.error?.includes?.('expired token')) {
    return data;
  }

  console.info('Retrying fetch...');
  const user = await googleGetLoggedInUser();
  let signupIsIncomplete;
  if (user) {
    ({ signupIsIncomplete } = await signinGoogle(getGoogleUser(user)));
    // Overload FTW - !signupIsIncomplete means the signin succeeded!
    console.info('SUCCESS: Google Auth refresh');
  }
  if (!user || signupIsIncomplete) {
    window.location.href = createNextUrl('signin');
  }
  // one retry
  const res2 = await fetch(url, {
    ...config,
    // reset Authorization header
    headers: { Authorization: getToken() },
  });
  return handleResponse(res2);
}

async function apiCall(
  method,
  url,
  data,
  abortSignal = null,
  config = getBaseConfig(abortSignal)
) {
  loadingStart();
  const configInternal = { ...config };
  configInternal.method = method;
  if (data) {
    configInternal.body = JSON.stringify(data); // body data type must match "Content-Type" header
  }
  const response = await fetchRefresh(`${API_URL}${url}`, configInternal);
  loadingStop();
  return response;
}

export async function apiGet(url, abortSignal = null) {
  return apiCall('GET', url, undefined, abortSignal);
}

export async function apiPost(url, data, abortSignal = null) {
  return apiCall('POST', url, data, abortSignal);
}

export async function apiPatch(url, data, abortSignal = null) {
  return apiCall('PATCH', url, data, abortSignal);
}

export async function apiDelete(url, abortSignal = null) {
  return apiCall('DELETE', url, undefined, abortSignal);
}

export async function uploadImage(formData, abortSignal = null) {
  const config = getBaseConfig();
  delete config.headers['Content-Type'];
  config.body = formData;
  if (abortSignal) {
    config.signal = abortSignal;
  }
  return apiCall('POST', '/image', undefined, undefined, config);
}

export async function signinAdmin(username, password) {
  const {
    error,
    data: { session, token },
  } = await apiPost('/signin', { username, password });
  if (error) {
    console.error('Admin Signin Error: ', error);
    return { error };
  }
  signin(token, session);
  return {};
}
