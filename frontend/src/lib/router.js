import { useEffect, useState } from 'react';

const listeners = new Set();
const current = () => location.pathname + location.search;

export function navigate(to, { replace = false } = {}) {
  const next = to.startsWith('/') ? to : '/' + to;
  if (next === current()) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', next);
  window.scrollTo({ top: 0, behavior: 'auto' });
  listeners.forEach((fn) => fn(next));
}

window.addEventListener('popstate', () => listeners.forEach((fn) => fn(current())));

if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1));

export function useRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    listeners.add(setRoute);
    return () => listeners.delete(setRoute);
  }, []);
  return route;
}

export function parseRoute(route) {
  const [path, query = ''] = route.split('?');
  const params = new URLSearchParams(query);
  const seg = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  return { path: '/' + seg.join('/'), seg, params };
}
