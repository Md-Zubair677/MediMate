// Simple error handler - no timeouts or retries
import axios from 'axios';

const createRetryAxios = (config = {}) => {
  const instance = axios.create({
    timeout: 3000, // Short timeout
    headers: {
      'Content-Type': 'application/json',
    },
    ...config // Spread the config to include baseURL
  });

  instance.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      return response;
    },
    (error) => {
      console.error(`❌ Request failed: ${error.message}`);
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createRetryAxios;
