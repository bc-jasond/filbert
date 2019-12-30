import { API_URL, AUTH_TOKEN_KEY } from './constants';

async function handleResponse(res) {
  const response = res?.status === 204 ? {} : await res.json();
  const shouldRedirect =
    res?.status === 401 && response?.error?.includes('expired');
  if (shouldRedirect) {
    window.location.href = `signin?next=${window.location.pathname}`;
  }
  // HACK: string parsing for 2XX level status code!
  // DUMB: don't use throw for control flow.  Return the whole response and let the client figure it out
  if (res.status.toString().charAt(0) !== '2') {
    throw new Error(
      `${res.status} ${res.statusText}\n${JSON.stringify(response)}`
    );
  }
  Pace.stop();
  return response;
}

function getBaseConfig() {
  return {
    // Default options are marked with *
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
      Authorization: localStorage.getItem(AUTH_TOKEN_KEY)
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer' // no-referrer, *client
  };
}

export async function apiGet(url) {
  try {
    Pace.start();
    const config = getBaseConfig();
    config.method = 'GET';
    const response = await fetch(`${API_URL}${url}`, config);
    return handleResponse(response);
  } catch (err) {
    Pace.stop();
    console.error('Fetch GET Error: ', err);
    throw err;
  }
}

export async function apiPost(
  url,
  data,
  shouldRemoveAuthorizationHeader = false
) {
  try {
    Pace.start();
    const config = getBaseConfig();
    if (shouldRemoveAuthorizationHeader) {
      delete config.headers.Authorization;
    }
    config.method = 'POST';
    config.body = JSON.stringify(data); // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}${url}`, config);
    return handleResponse(response);
  } catch (err) {
    Pace.stop();
    console.error('Fetch POST Error: ', err);
    throw err;
  }
}

export async function uploadImage(formData) {
  try {
    Pace.start();
    const url = '/image';
    const config = getBaseConfig();
    config.method = 'POST';
    delete config.headers['Content-Type'];
    config.body = formData; // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}${url}`, config);
    return handleResponse(response);
  } catch (err) {
    Pace.stop();
    console.error('Fetch POST Error: ', err);
    throw err;
  }
}

export async function apiPatch(url, data) {
  try {
    Pace.start();
    const config = getBaseConfig();
    config.method = 'PATCH';
    config.body = JSON.stringify(data); // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}${url}`, config);
    return handleResponse(response);
  } catch (err) {
    Pace.stop();
    console.error('Fetch PATCH Error: ', err);
    throw err;
  }
}

export async function apiDelete(url) {
  try {
    Pace.start();
    const config = getBaseConfig();
    config.method = 'DELETE';
    const response = await fetch(`${API_URL}${url}`, config);
    return handleResponse(response);
  } catch (err) {
    Pace.stop();
    console.error('Fetch DELETE Error: ', err);
    throw err;
  }
}
