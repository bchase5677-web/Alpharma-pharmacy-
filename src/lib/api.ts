export function getApiUrl(path: string): string {
  try {
    if (document.baseURI && !document.baseURI.startsWith('about:')) {
      return new URL(path, document.baseURI).href;
    }
  } catch (e) {}
  
  try {
    if (window.location.origin && window.location.origin !== 'null') {
      return window.location.origin + path;
    }
  } catch (e) {}
  
  return path;
}
