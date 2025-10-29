// src/services/api.ts
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
});

// ดึง token จาก storage ทุกครั้งก่อนยิง request
function getToken(): string | null {
  return (
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken')
  );
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// (ถ้าต้องการ) รวมรูปแบบ error ให้เหมือนกัน
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

// helper เผื่อใช้ตอน login/logout
export function setAuthToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('authToken', token);
  } else {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
  }
}
