// Cần cài axios trước khi dùng file này: npm install axios
import axios from 'axios';

// Địa chỉ API backend (FastAPI chạy cổng 8000). Có thể ghi đè bằng biến môi
// trường VITE_API_URL trong file frontend/.env.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
});

export default api;
