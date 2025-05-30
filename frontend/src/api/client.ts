import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export default axios.create({
  baseURL: API_BASE,
});