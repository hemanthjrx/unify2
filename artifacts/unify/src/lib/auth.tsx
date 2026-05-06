import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  usn: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("unify_auth_token");
    const storedUser = localStorage.getItem("unify_auth_user");
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser(parsedUser);
        setAuthTokenGetter(() => storedToken);
      } catch {
        localStorage.removeItem("unify_auth_token");
        localStorage.removeItem("unify_auth_user");
      }
    }
    setIsLoaded(true);
  }, []);

  function login(token: string, newUser: AuthUser) {
    localStorage.setItem("unify_auth_token", token);
    localStorage.setItem("unify_auth_user", JSON.stringify(newUser));
    setUser(newUser);
    setAuthTokenGetter(() => token);
  }

  function logout() {
    localStorage.removeItem("unify_auth_token");
    localStorage.removeItem("unify_auth_user");
    setUser(null);
    setAuthTokenGetter(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoaded, isSignedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AuthProvider");
  return ctx;
}
