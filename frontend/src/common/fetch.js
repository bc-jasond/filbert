import { API_URL } from './constants';
import { getAuthToken } from './session';

function getBaseConfig() {
  return {
    // Default options are marked with *
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthToken(),
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
  };
}

export async function apiGet(url) {
  try {
    const config = getBaseConfig();
    config.method = 'GET';
    const response = await fetch(`${API_URL}${url}`, config);
    return response.json();
  } catch (err) {
    console.error('Fetch GET Error: ', err);
    throw err;
  }
}

export async function apiPost(url, data) {
  try {
    const config = getBaseConfig();
    config.method = 'POST';
    config.body = JSON.stringify(data); // body data type must match "Content-Type" header
    const response = await fetch(`${API_URL}${url}`, config);
    if (response.status.toString(10).charAt(0) !== '2') {
      throw new Error(`${response.status} - ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    console.error('Fetch POST Error: ', err);
    throw err;
  }
}
