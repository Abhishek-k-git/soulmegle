import axios from "axios";
import { API_ENDPOINTS } from "../utils/endpoints";

const api = axios.create({
   baseURL: import.meta.env.VITE_BACKEND_SERVICE_URL,
   headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
   }
});

// Add request interceptor to include Bearer token
api.interceptors.request.use(
   (config) => {
      const token = localStorage.getItem('token');
      if (token) {
         config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
   },
   (error) => {
      return Promise.reject(error);
   }
);

export const auth = {
   register: async (email, password) => {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, { email, password });
      if (response.data.token) {
         localStorage.setItem('token', response.data.token);
      }
      return response;
   },

   login: async (email, password) => {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      if (response.data.token) {
         localStorage.setItem('token', response.data.token);
      }
      return response;
   },

   logout: () => {
      localStorage.removeItem('token');
      return api.post(API_ENDPOINTS.AUTH.LOGOUT);
   },
};

export const user = {
   getProfile: () => api.get(API_ENDPOINTS.USER.GET_PROFILE),

   updateInterests: (interests) =>
      api.put(API_ENDPOINTS.USER.UPDATE_INTERESTS, { interests }),
};

export default api;
