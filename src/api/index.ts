import api from './axios';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  verifyOtp: (data: { email: string; otp: string }) =>
    api.post("/auth/verify/otp", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
};
