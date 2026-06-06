import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from JWT on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("hrise_jwt_token");
      if (token) {
        try {
          const fetchedUser = await api.auth.getMe();
          setUser(fetchedUser);
        } catch (e) {
          console.error("Token verification failed:", e);
          localStorage.removeItem("hrise_jwt_token");
          localStorage.removeItem("hrise_refresh_token");
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem("hrise_jwt_token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("hrise_refresh_token", data.refreshToken);
      }
      setUser(data.user);
      return data.user;
    } catch (e) {
      throw e;
    }
  }, []);


  const signup = useCallback(async (signupData) => {
    try {
      const data = await api.auth.signup(signupData);
      localStorage.setItem("hrise_jwt_token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("hrise_refresh_token", data.refreshToken);
      }
      setUser(data.user);
      return data.user;
    } catch (e) {
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("hrise_jwt_token");
    localStorage.removeItem("hrise_refresh_token");
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
