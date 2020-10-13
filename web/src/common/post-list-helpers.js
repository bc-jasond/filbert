import { getApiClientInstance } from './api-client';
import { formatPostDate } from './utils';
import { loading } from '../stores';

export function pushHistory(param, value) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  if (value) {
    urlSearchParams.set(param, value === true ? '' : value);
  } else {
    urlSearchParams.delete(param);
  }
  const updatedQueryString =
    urlSearchParams.toString().length > 0
      ? `?${urlSearchParams.toString()}`
      : '';
  // update the URL in history for the user to retain, only if it changed!
  if (window.location.search != updatedQueryString) {
    window.history.pushState(
      {},
      document.title,
      `${window.location.pathname}${updatedQueryString}`
    );
  }
  return urlSearchParams;
}

export async function loadPosts(url, urlSearchParams, fetchClient) {
  loading.set(true);
  const apiClient = getApiClientInstance(fetchClient);
  const params = urlSearchParams.toString();
  const queryString = params.length > 0 ? `?${params}` : '';
  const { error, data: postsData } = await apiClient.get(
    `${url}${queryString}`
  );
  loading.set(false);
  return postsData.map((post) => ({
    ...post,
    published: formatPostDate(post.published),
    updated: formatPostDate(post.updated),
  }));
}
