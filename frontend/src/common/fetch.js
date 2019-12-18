import { API_URL, AUTH_TOKEN_KEY } from './constants';

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
    // HACK: string parsing for 2XX level status code!
    // DUMB: don't use throw for control flow.  Return the whole response and let the client figure it out
    if (response.status.toString(10).charAt(0) !== '2') {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    Pace.stop();
    return response.json();
  } catch (err) {
    Pace.stop();
    console.error('Fetch GET Error: ', err);
    throw err;
  }
}

export async function apiPost(url, data) {
  try {
    Pace.start();
    const config = getBaseConfig();
    config.method = 'POST';
    config.body = JSON.stringify(data); // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}${url}`, config);
    // HACK: string parsing for 2XX level status code!
    // DUMB: don't use throw for control flow.  Return the whole response and let the client figure it out
    if (response.status.toString(10).charAt(0) !== '2') {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    Pace.stop();
    return response.json();
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
    // HACK: string parsing for 2XX level status code!
    // DUMB: don't use throw for control flow.  Return the whole response and let the client figure it out
    if (response.status.toString(10).charAt(0) !== '2') {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    Pace.stop();
    return response.json();
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
    // HACK: string parsing for 2XX level status code!
    // DUMB: don't use throw for control flow.  Return the whole response and let the client figure it out
    if (response.status.toString(10).charAt(0) !== '2') {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    Pace.stop();
    return response.json();
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
    await fetch(`${API_URL}${url}`, config);
    Pace.stop();
    return true;
  } catch (err) {
    Pace.stop();
    console.error('Fetch DELETE Error: ', err);
    throw err;
  }
}
