async function call(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  const API_BASE = 'https://booknest-backend-m644.onrender.com';
  const res = await fetch('/api' + path, {
    method,
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  get: (p) => call(p),
  post: (p, body) => call(p, { method: 'POST', body }),
  put: (p, body) => call(p, { method: 'PUT', body: body || {} }),
  del: (p) => call(p, { method: 'DELETE' }),
};

export const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const isOverdue = (i) => !i.returnDate && new Date(i.dueDate) < new Date();
