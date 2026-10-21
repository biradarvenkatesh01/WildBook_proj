/**
 * api/client.js
 * Thin wrapper around fetch that:
 *  - prepends the base URL
 *  - injects the JWT Authorization header
 *  - throws a structured error on non-2xx responses
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

function getToken() {
  return localStorage.getItem('wb_token');
}

async function request(path, options = {}) {
  const token = getToken();

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorBody;
    try { errorBody = await response.json(); }
    catch { errorBody = { error: response.statusText }; }
    const err = new Error(errorBody.error || 'Request failed');
    err.status = response.status;
    err.data   = errorBody;
    throw err;
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

const client = {
  get:    (path, opts)        => request(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts)  => request(path, { method: 'POST',   body: JSON.stringify(body), ...opts }),
  put:    (path, body, opts)  => request(path, { method: 'PUT',    body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts)  => request(path, { method: 'PATCH',  body: JSON.stringify(body), ...opts }),
  delete: (path, opts)        => request(path, { method: 'DELETE', ...opts }),

  /** For multipart/form-data uploads — does NOT set Content-Type (browser sets it with boundary) */
  upload: (path, formData, opts) =>
    request(path, {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set the content-type with boundary
      ...opts,
    }),
};

export default client;
