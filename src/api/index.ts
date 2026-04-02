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

export const sharingApi = {
  generateLink: (documentId: string) =>
    api.post(`/documents/${documentId}/share`),
  joinViaLink: (shareToken: string) =>
    api.post("/documents/join", { shareToken }),
};

export const memberApi = {
  getAll: (documentId: string) => api.get(`/documents/${documentId}/members`),
  invite: (
    documentId: string,
    data: { email: string; role: "editor" | "viewer" },
  ) => api.post(`/documents/${documentId}/members/invite`, data),
  updateRole: (
    documentId: string,
    memberId: string,
    role: "editor" | "viewer",
  ) => api.put(`/documents/${documentId}/members/${memberId}`, { role }),
  remove: (documentId: string, memberId: string) =>
    api.delete(`/documents/${documentId}/members/${memberId}`),
};

export const historyApi = {
  getAll: (documentId: string) => api.get(`/documents/${documentId}/history`),
  restore: (documentId: string, historyId: string) =>
    api.post(`/documents/${documentId}/history/${historyId}/restore`),
};

export const commentApi = {
  getAll: (documentId: string) => api.get(`/documents/${documentId}/comments`),
  add: (
    documentId: string,
    data: {
      content: string;
      selectedText?: string;
      rangeStart?: number;
      rangeEnd?: number;
    },
  ) => api.post(`/documents/${documentId}/comments`, data),
  reply: (documentId: string, commentId: string, content: string) =>
    api.post(`/documents/${documentId}/comments/${commentId}/reply`, {
      content,
    }),
  resolve: (documentId: string, commentId: string) =>
    api.put(`/documents/${documentId}/comments/${commentId}/resolve`),
};

export const activityApi = {
  getAll: (documentId: string) => api.get(`/documents/${documentId}/activity`),
};

export const invitationApi = {
  getPending: () => api.get("/invitations"),
  accept: (invitationId: string) =>
    api.post(`/invitations/${invitationId}/accept`),
  decline: (invitationId: string) =>
    api.post(`/invitations/${invitationId}/decline`),
};
