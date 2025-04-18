import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";

// Define the type for the context's value
interface AuthContextType {
  token: string | null;
  login: (newToken: string) => void;
  logout: () => void;
  getUserEmail: () => string | null;
  user_id: string | null;
}

// Create the context with `null` as the default value
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user_id, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a token in localStorage when the app mounts
    const savedToken = localStorage.getItem("access_token");
    const savedUserId = localStorage.getItem("user_id");
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  const getUserEmail = (): string | null => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return null;
    }

    try {
      const decoded: { sub: string } = jwtDecode(token);
      return decoded.sub;
    } catch (err) {
      console.error("Invalid token:", err);
      return null;
    }
  };

  const login = (newToken: string) => {
    localStorage.setItem("access_token", newToken); // Store the token in localStorage
    setUserId(newToken); // Set the token in context
  };

  const logout = () => {
    localStorage.removeItem("access_token"); // Remove token from localStorage
    localStorage.removeItem("user_id"); // Remove user_id from localStorage
    setToken(null); // Remove token from context
    setUserId(null); // Remove user_id from context
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, getUserEmail, user_id }}>
      {children}
    </AuthContext.Provider>
  );
};
