import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth";
import axios from "../api/axios";
import { toast } from "react-toastify";
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const tokenUrl = searchParams.get("token") || localStorage.getItem("access_token");
    const emailUrl = searchParams.get("email") || localStorage.getItem("user_email");

    if (tokenUrl && emailUrl) {
      localStorage.setItem("access_token", tokenUrl);
      localStorage.setItem("user_email", emailUrl);
      login(tokenUrl);
      navigate("/home");
    }
  }, [searchParams]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = { email, password };
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    try {
      const response = await axios.post("/user/login", user);
      const data = response.data;
      // Handle response
      if (response.status === 200 && data.access_token) {
        // Save the token in localStorage or sessionStorage (or context)
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user_email", email);
        login(data.access_token);
        toast.success("Login successful!");
        // Optionally redirect to the home page or dashboard
        navigate("/home");
      } else {
        toast.error(data.detail || "Invalid email or password.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "An error occurred. Please try again."
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* container */}
      <div className="max-w-[350px] flex flex-col gap-4">
        <h2 className="text-2xl font-medium text-center mb-2">
          Welcome to Luga.ai
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            className="w-full p-3 rounded-lg bg-gray-50"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full p-3 rounded-lg bg-gray-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between">
          <p>Not a member? </p>
          <a
            className="text-blue-600 hover:text-blue-800 hover:underline"
            href="/register"
          >
            Register
          </a>{" "}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
