import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

const SocialAuth = ({ onSuccess }) => {
  const [loading, setLoading] = useState({
    google: false,
    // facebook: false
  });
  const navigate = useNavigate();

  const handleGoogleLogin = async (response) => {
    setLoading((prev) => ({ ...prev, google: true }));
    try {
      const { credential } = response;
      const result = await axios.post("/user/auth/google", {
        token: credential,
      });

      if (result.data.access_token) {
        localStorage.setItem("access_token", result.data.access_token);
        localStorage.setItem("user_email", result.data.user.email);
        onSuccess(result.data.access_token);
        toast.success("Login successful!");
        navigate("/home");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Google login failed");
      console.error("Google login error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, google: false }));
    }
  };


  // Initialize Google Sign-In
  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        { theme: "dark", size: "large", width: "100%" }
      );
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div id="google-login-button"></div>
      </div>
    </div>
  );
};

export default SocialAuth;
