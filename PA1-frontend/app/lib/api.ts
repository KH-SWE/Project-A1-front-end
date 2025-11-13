import axios from "axios";
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from "./token";

// 👇 set your local dev base URL (later replace with prod env var)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
// attach access token on every request
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh logic on 401; retry original request once
let isRefreshing = false;
let pendingQueue: { resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(p => (error ? p.reject(error) : p.resolve(token || undefined)));
  pendingQueue = [];
}

// response interceptor to handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // if no response or not 401, just bubble up
    if (!error.response || error.response.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // mark to avoid infinite loop
    original._retry = true;

    // queue requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: async () => {
            try {
              const token = await getAccessToken();
              original.headers = original.headers || {};
              if (token) original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } catch (e) {
              reject(e);
            }
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      // call your refresh endpoint
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      // store new access token
      await setAccessToken(data.accessToken);

      flushQueue(null, data.accessToken);
      // retry original with new token
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      flushQueue(err, null);
      // optional: clear tokens so app can route to login
      await clearTokens();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);