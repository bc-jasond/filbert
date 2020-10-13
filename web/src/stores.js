import { writable, readable } from 'svelte/store';
import { Map } from 'immutable';

export let loading = writable(false);
export let GoogleAuth = writable(undefined);
export let currentPost = writable(Map());
