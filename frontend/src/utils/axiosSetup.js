import axios from 'axios';

// Base URL from Vite env
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Ensure baseURL is set once for all axios calls
if (BASE_URL) {
  axios.defaults.baseURL = BASE_URL;
}

// Attach Authorization header if access token exists
axios.interceptors.request.use((config) => {
  const access = sessionStorage.getItem('access');
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  
  // Add consent status header for GDPR compliance
  const consentStatus = window.axeptio?.getConsentStatus?.() || 'pending';
  config.headers['X-Consent-Status'] = consentStatus;
  
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newAccessToken) {
  pendingRequests.forEach((cb) => cb(newAccessToken));
  pendingRequests = [];
}

function addPendingRequest(cb) {
  pendingRequests.push(cb);
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const status = error?.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('api/accounts/login/') || originalRequest?.url?.includes('api/accounts/token/refresh/');

    // Only attempt refresh on 401 for non-auth endpoints
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refresh = sessionStorage.getItem('refresh');
      if (!refresh) {
        // No refresh token available -> logout
        sessionStorage.removeItem('access');
        sessionStorage.removeItem('refresh');
        sessionStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        if (isRefreshing) {
          // Queue the request until refresh is done
          return new Promise((resolve, reject) => {
            addPendingRequest((newToken) => {
              try {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(axios(originalRequest));
              } catch (e) {
                reject(e);
              }
            });
          });
        }

        isRefreshing = true;
        const resp = await axios.post('api/accounts/token/refresh/', { refresh });
        const newAccess = resp?.data?.access;
        if (newAccess) {
          sessionStorage.setItem('access', newAccess);
          onRefreshed(newAccess);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return axios(originalRequest);
        }

        // If no access in response, treat as failure
        throw new Error('No access token in refresh response');
      } catch (refreshErr) {
        // Refresh failed -> logout
        sessionStorage.removeItem('access');
        sessionStorage.removeItem('refresh');
        sessionStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axios;


