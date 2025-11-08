import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

type AuthContextType = {
  userId: string | null;
  loading: boolean;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "userId";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const id = await SecureStore.getItemAsync(STORAGE_KEY);
        if (id) setUserId(id);
      } catch (e) {
        console.warn("SecureStore read failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (id: string) => {
    await SecureStore.setItemAsync(STORAGE_KEY, id);
    setUserId(id);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthProvider;
