export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function isActive(path: string, prefix: string) {
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(prefix + '/');
}
