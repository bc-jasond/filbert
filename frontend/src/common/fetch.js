import { API_URL } from './constants';

export async function apiGet(url) {
  try {
    const response = await fetch(`${API_URL}${url}`);
    return response.json();
  } catch (err) {
    console.error('Fetch GET Error: ', err);
    throw err;
  }
}

export async function apiPost(url, data) {
  // Default options are marked with *
  const config = {
    method: 'POST',
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  };
  const response = await fetch(`${API_URL}${url}`, config);
  if (response.status.toString(10).charAt(0) !== '2') {
    throw new Error(`${response.status} - ${response.statusText}`);
  }
  return response.json();
}
