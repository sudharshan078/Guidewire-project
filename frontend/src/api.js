import axios from 'axios';

const API = axios.create({
  baseURL: '',  // proxied via vite
  headers: { 'Content-Type': 'application/json' },
});

export default API;
