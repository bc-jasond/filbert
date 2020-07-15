import { useEffect, useState } from 'react';

const loadingState = {
  isLoading: false,
};

export function useLoading() {
  const [loading, setLoading] = useState(loadingState.isLoading);

  useEffect(() => {
    function loadingListener(e) {
      console.log('LOADING - SETTING value', e.detail);
      // eslint-disable-next-line prefer-destructuring
      loadingState.isLoading = e.detail;
      setLoading(e.detail);
    }
    console.log('LOADING - ADD');
    document.addEventListener('filbertLoading', loadingListener);
    return () => {
      console.log('LOADING - REMOVE');
      document.removeEventListener('filbertLoading', loadingListener);
    };
  }, []);

  return { loading, setLoading };
}

function loadingInternal(isLoading) {
  document.dispatchEvent(
    new CustomEvent('filbertLoading', { detail: isLoading })
  );
}

export function loadingStart() {
  return loadingInternal(true);
}

export function loadingStop() {
  return loadingInternal(false);
}
