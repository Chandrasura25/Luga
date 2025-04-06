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

  // const handleFacebookLogin = async (response) => {
  //   setLoading(prev => ({ ...prev, facebook: true }));
  //   try {
  //     const { accessToken } = response;
  //     const result = await axios.post("/user/auth/facebook", { access_token: accessToken });

  //     if (result.data.access_token) {
  //       localStorage.setItem("access_token", result.data.access_token);
  //       localStorage.setItem("user_email", result.data.user.email);
  //       onSuccess(result.data.access_token);
  //       toast.success("Login successful!");
  //       navigate("/home");
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.detail || "Facebook login failed");
  //     console.error("Facebook login error:", error);
  //   } finally {
  //     setLoading(prev => ({ ...prev, facebook: false }));
  //   }
  // };

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

  // Initialize Facebook SDK
  // useEffect(() => {
  //   if (window.FB) {
  //     window.FB.init({
  //       appId: import.meta.env.VITE_FACEBOOK_APP_ID,
  //       cookie: true,
  //       xfbml: true,
  //       version: 'v18.0'
  //     });
  //   }
  // }, []);

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

        {/* <button
          onClick={() => {
            window.FB.login((response) => {
              if (response.authResponse) {
                handleFacebookLogin(response.authResponse);
              }
            }, { scope: 'email,public_profile' });
          }}
          disabled={loading.facebook}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {loading.facebook ? "Connecting..." : "Facebook"}
        </button> */}
      </div>
    </div>
  );
};

export default SocialAuth;
