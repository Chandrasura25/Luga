import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import logo from "../assets/logo.jpeg";
import { Lock, Eye, EyeOff } from "lucide-react";

const PasswordReset = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const email = localStorage.getItem("email");
      const response = await axios.post("/user/password-reset", {
        password,
        email,
      });
      if (response.status === 200) {
        localStorage.removeItem("email");
        toast({
          title: "Success",
          description: "Password reset successful.",
          variant: "default",
        });
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response.data.detail || "An error occurred. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* container */}
      <div className="max-w-md w-full flex flex-col gap-4">
        <div className="w-full h-full">
          <img src={logo} alt="logo" style={{ height: "100px" }} />
        </div>
        <h2 className="text-2xl font-medium mb-2">Reset your password</h2>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
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
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Confirm your password"
              className="w-full pl-10 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <button
              type="button"
              className="absolute right-3 top-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 w-full text-base font-medium text-white bg-[#8EB4CC] rounded-md hover:bg-[#8EB4CC]/80 transition-colors"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;
