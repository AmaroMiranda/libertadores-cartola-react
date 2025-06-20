// src/services/api.js
import axios from "axios";

// 1. Define o URL base da API.
//    process.env.REACT_APP_API_URL será configurado na Vercel.
//    Para desenvolvimento local, ele usa o servidor local.
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// 2. Cria uma nova instância do Axios com a configuração base.
//    Isto garante que TODAS as rotas comecem com o prefixo /api.
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// 3. (BÓNUS) Adiciona um "interceptor" que anexa automaticamente o token de login
//    a todos os pedidos, caso ele exista. Isto limpa o código nas outras páginas.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
