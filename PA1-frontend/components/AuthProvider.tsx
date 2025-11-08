import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { saveTokens, clearTokens } from "../app/lib/token";

type TokenPair = { accessToken?: string; refreshToken?: string } | undefined;

type AuthContextType = {
  userId: number | null;
  loading: boolean;
  login: (id: number | string, tokens?: TokenPair) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "userId";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const idStr = await SecureStore.getItemAsync(STORAGE_KEY);
        if (idStr) {
          const n = Number(idStr);
          if (Number.isFinite(n)) setUserId(n);
        }
      } catch (e) {
        console.warn("SecureStore read failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (id: number | string, tokens?: TokenPair) => {
    try {
      const idNum = typeof id === 'string' ? Number(id) : id;
      if (!Number.isFinite(idNum)) throw new Error('Invalid user id');
      // store numeric id as string
      await SecureStore.setItemAsync(STORAGE_KEY, String(idNum));
      if (tokens?.accessToken || tokens?.refreshToken) {
        // saveTokens expects strings; guard undefined with empty string if necessary
        await saveTokens(tokens.accessToken ?? "", tokens.refreshToken ?? "");
      }
      setUserId(idNum);
    } catch (e) {
      console.warn("Auth login failed", e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await clearTokens();
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch (e) {
      console.warn("Auth logout failed", e);
    } finally {
      setUserId(null);
    }
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
