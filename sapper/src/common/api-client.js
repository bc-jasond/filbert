import { loading } from '../stores';

function getBaseConfig(abortSignal = null) {
  const config = {
    // Default options are marked with *
    mode: 'cors', // no-cors, cors, *same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // forward HTTP-Only cookies
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

export function getApiClientInstance(fetchClient) {
  async function fetchRefresh(url, config) {
    const res = await fetchClient(url, config);
    return handleResponse(res);
  }

  async function apiCall(
    method,
    url,
    data,
    abortSignal = null,
    config = getBaseConfig(abortSignal)
  ) {
    loading.set(true);
    const configInternal = { ...config };
    configInternal.method = method;
    if (data) {
      configInternal.body = JSON.stringify(data); // body data type must match "Content-Type" header
    }
    const response = await fetchRefresh(`${url}`, configInternal);
    loading.set(false);
    return response;
  }

  async function signinGoogle(googleUser, filbertUsername) {
    loading.set(true);
    const config = getBaseConfig();
    config.method = 'POST';
    config.body = JSON.stringify({ googleUser, filbertUsername }); // body data type must match "Content-Type" header
    const response = await fetchClient(`/signin-google`, config);
    const { error, data } = await handleResponse(response);
    loading.set(false);
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

  async function apiGet(url, abortSignal = null) {
    return apiCall('GET', url, undefined, abortSignal);
  }

  async function apiPost(url, data, abortSignal = null) {
    return apiCall('POST', url, data, abortSignal);
  }

  async function apiPatch(url, data, abortSignal = null) {
    return apiCall('PATCH', url, data, abortSignal);
  }

  async function apiDelete(url, abortSignal = null) {
    return apiCall('DELETE', url, undefined, abortSignal);
  }

  async function uploadImage(formData, abortSignal = null) {
    const config = getBaseConfig();
    delete config.headers['Content-Type'];
    config.body = formData;
    if (abortSignal) {
      config.signal = abortSignal;
    }
    return apiCall('POST', '/image', undefined, undefined, config);
  }

  async function signinAdmin(username, password) {
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

  return {
    signinAdmin,
    signinGoogle,
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
    del: apiDelete,
    uploadImage,
  };
}
