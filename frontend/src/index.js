// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Buffer } from "buffer";
import { AuthProvider } from "./context/AuthContext";

window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
