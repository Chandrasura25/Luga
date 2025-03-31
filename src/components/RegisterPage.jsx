import { useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import logo from "../assets/logo.jpeg";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = { email, password, username };
    try {
      const response = await axios.post("/user/register", user);

      const data = response.data;

      //Handle Response
      if (response.status === 200 && data.success) {
        toast.success(data.message);
        setEmail("");
        setPassword("");
        setUsername("");
      } else {
        toast.error(data.message || "Registration failed.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex justify-center items-center">
      {/* container */}
      <div className="max-w-md w-full flex flex-col gap-4 z-10 bg-[rgba(255,255,255,0.3)] backdrop-blur-sm rounded-lg p-4">
        <div className="w-full h-full">
          <img src={logo} alt="logo" style={{ height: "100px" }} />
        </div>
        <h2 className="text-2xl font-medium mb-2">
          Welcome to Luga AI
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              className="w-full pl-10 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
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
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              className="w-full pl-10 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}{" "}
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 w-full text-base font-medium text-white bg-[#8EB4CC] rounded-md hover:bg-[#8EB4CC]/80 transition-colors"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between">
          <p>Already had an account? </p>
          <a
            className="text-blue-600 hover:text-blue-800 hover:underline"
            href="/login"
          >
            Back to Login
          </a>{" "}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
