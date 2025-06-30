// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api"; // Importando o 'api' para consistência

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Troque localStorage por sessionStorage
  const [token, setToken] = useState(sessionStorage.getItem("authToken"));

  useEffect(() => {
    if (token) {
      // A configuração do axios já é feita no interceptor do 'api.js',
      // mas manter aqui garante consistência se o AuthContext for usado em outro lugar.
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      sessionStorage.setItem("authToken", token); // Salve em sessionStorage
    } else {
      delete api.defaults.headers.common["Authorization"];
      sessionStorage.removeItem("authToken"); // Remova de sessionStorage
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
