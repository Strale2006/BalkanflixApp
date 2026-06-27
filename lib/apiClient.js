import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://balkanflix-server.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
