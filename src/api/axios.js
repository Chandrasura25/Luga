  import axios from "axios";
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getAccessToken = () => localStorage.getItem("accessToken");

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  axiosPrivate.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && !config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  export default axiosInstance;
  export { axiosPrivate };
