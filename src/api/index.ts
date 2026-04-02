import api from './axios';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  verifyOtp: (data: { email: string; otp: string }) =>
    api.post("/auth/verify/otp", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
};

export const documentApi = {
  getAll: () => api.get("/documents"),
  create: (data?: { title?: string }) => api.post("/documents", data || {}),
  getById: (id: string) => api.get(`/documents/${id}`),
  update: (id: string, data: { title: string }) =>
    api.put(`/documents/${id}`, data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};
