import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://balkanflix-server.up.railway.app/api', // Replace with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
