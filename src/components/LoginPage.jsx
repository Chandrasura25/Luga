import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth";
import axios from "../api/axios";
import logo from "../assets/logo.jpeg";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, Mail } from "lucide-react"; // Import eye icons
import SocialAuth from "./SocialAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  useEffect(() => {
    const tokenUrl =
      searchParams.get("token") || localStorage.getItem("access_token");
    const emailUrl =
      searchParams.get("email") || localStorage.getItem("user_email");

    if (tokenUrl && emailUrl) {
      localStorage.setItem("access_token", tokenUrl);
      localStorage.setItem("user_email", emailUrl);
      login(tokenUrl);
      navigate("/home");
    }
  }, []);

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
    <div className="min-h-screen bg-white flex justify-center items-center relative overflow-hidden">
      {/* container */}
      <div className="max-w-md w-full flex flex-col gap-4 z-10 bg-[rgba(255,255,255,0.3)] backdrop-blur-sm rounded-lg p-4">
        <div className="w-full h-full">
          <img src={logo} alt="logo" style={{ height: "100px" }} />
        </div>
        <h2 className="text-2xl font-medium mb-2">Welcome to Luga AI</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              className="w-full pl-10 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"} // Toggle between text and password
              placeholder="Enter your password"
              className="w-full pl-10 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}{" "}
              {/* Show eye icon based on state */}
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 w-full text-base font-medium text-white bg-[#8EB4CC] rounded-md hover:bg-[#8EB4CC]/80 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <SocialAuth onSuccess={login} />

        <div className="flex items-center justify-between">
          <a
            className="text-blue-600 hover:text-blue-800 hover:underline"
            href="/forgot-password"
          >
            Forgot Password?
          </a>
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
