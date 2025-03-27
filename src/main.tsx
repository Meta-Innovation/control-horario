import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./components/providers/auth-provider";
import { ThemeProvider } from "./components/theme-provider";
import { ToastManager } from "./components/ui/toast";
import { Toaster } from "./components/ui/use-toast";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <ToastManager>
      <BrowserRouter basename="/control-horario">
        <ThemeProvider
          defaultTheme="system"
          storageKey="control-horario-theme"
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <Toaster />
    </ToastManager>
  </React.StrictMode>
);

// Generated by Copilot
