import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import logo from "../assets/logo.jpeg";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/user/forgot-password", { email });
      if (response.status === 200) {
        navigate("/reset-code");
        toast({
          title: "Success",
          description: "Password reset email sent, please check your email",
          variant: "default",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error.response.data.detail,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* container */}
      <div className="w-[400px] flex flex-col gap-4">
        <div className="w-full h-full">
          <img src={logo} alt="logo" style={{ height: "100px" }} />
        </div>
        <h2 className="text-2xl font-medium mb-2">Welcome to Luga AI</h2>

        <form onSubmit={handleForgotPassword} className="space-y-4">
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
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 w-full text-base font-medium text-white bg-[#8EB4CC] rounded-md hover:bg-[#8EB4CC]/80 transition-colors"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-end">
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

export default ForgotPassword;
