import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleForgotPassword = async () => {
    try {   
      const response = await axios.post("/user/forgot-password", { email });
     if(response.status === 200){
      navigate("/reset-code");
     }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error.response.data.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      {/* container */}
      <div className="w-[400px] flex flex-col gap-4">
      <h2 className="text-2xl font-medium text-center mb-2">
        Welcome to Luga.ai
      </h2>

      <form onSubmit={handleForgotPassword} className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          className="w-full p-3 rounded-lg bg-gray-50"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>
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
  )
}

export default ForgotPassword