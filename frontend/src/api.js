const BASE = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem('sd_token');

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the SprintDesk API. Start the backend and make sure MongoDB is running.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
    window.location.reload();
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  projects: () => request('/projects'),
  createProject: (b) => request('/projects', { method: 'POST', body: b }),
  project: (id) => request(`/projects/${id}`),
  addMember: (id, b) => request(`/projects/${id}/members`, { method: 'POST', body: b }),
  sprints: (id) => request(`/projects/${id}/sprints`),
  createSprint: (id, b) => request(`/projects/${id}/sprints`, { method: 'POST', body: b }),
  updateSprint: (id, sid, b) => request(`/projects/${id}/sprints/${sid}`, { method: 'PATCH', body: b }),
  tickets: (id) => request(`/projects/${id}/tickets`),
  createTicket: (id, b) => request(`/projects/${id}/tickets`, { method: 'POST', body: b }),
  updateTicket: (id, tid, b) => request(`/projects/${id}/tickets/${tid}`, { method: 'PATCH', body: b }),
  deleteTicket: (id, tid) => request(`/projects/${id}/tickets/${tid}`, { method: 'DELETE' }),
  addComment: (id, tid, text) => request(`/projects/${id}/tickets/${tid}/comments`, { method: 'POST', body: { text } }),
};
