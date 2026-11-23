import axios from "axios";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });
api.interceptors.request.use(config => {
  const token = localStorage.getItem("expense_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(r => r, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem("expense_token");
    localStorage.removeItem("expense_user");
    if (window.location.pathname !== "/") window.location.href = "/";
  }
  return Promise.reject(error);
});
export const money = value => new Intl.NumberFormat(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
