import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

const PasswordReset = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
        description: error.response.data.detail || "An error occurred. Please try again.",
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
      <div className="max-w-[350px] flex flex-col gap-4">
        <h2 className="text-2xl font-medium text-center mb-2">
          Reset your password
        </h2>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            className="w-full p-3 rounded-lg bg-gray-50"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm your password"
            className="w-full p-3 rounded-lg bg-gray-50"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors w-full"
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
