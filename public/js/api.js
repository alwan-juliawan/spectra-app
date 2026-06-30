const BASE = "";

async function request(method, path, body) {
  const opts = { method, headers: {} };
  const token = localStorage.getItem("token");
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;

  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}/api${path}`, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

export const api = {
  // Auth
  register: (body) => request("POST", "/auth/register", body),
  login: (body) => request("POST", "/auth/login", body),
  me: () => request("GET", "/auth/me"),
  logout: () => request("POST", "/auth/logout"),

  // Invoices
  getInvoices: () => request("GET", "/invoices"),
  getInvoice: (id) => request("GET", `/invoices/${id}`),
  createInvoice: (body) => request("POST", "/invoices", body),
  updateStatus: (id, status) => request("PATCH", `/invoices/${id}/status`, { status }),
  deleteInvoice: (id) => request("DELETE", `/invoices/${id}`),

  // Bio
  getMyBio: () => request("GET", "/bio"),
  putBio: (body) => request("PUT", "/bio", body),
  getPublicBio: (slug) => request("GET", `/bio/${slug}`),

  // Habits
  getHabits: () => request("GET", "/habits"),
  createHabit: (body) => request("POST", "/habits", body),
  deleteHabit: (id) => request("DELETE", `/habits/${id}`),
  toggleHabit: (id) => request("POST", `/habits/${id}/toggle`),
  getHabitStats: () => request("GET", "/habits/stats"),
};
