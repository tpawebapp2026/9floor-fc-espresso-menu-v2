export const BASE = import.meta.env.BASE_URL;
export const STATIC_READER = import.meta.env.VITE_STATIC_READER === "true";
export function asset(name: string) {
  return BASE + name;
}
export function readRoute() {
  return STATIC_READER ? location.hash.slice(1) || "/" : location.pathname;
}
export function routeURL(path: string) {
  return STATIC_READER ? BASE + "#" + path : path;
}
