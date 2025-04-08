import { useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import logo from "../assets/logo.jpeg";
import SocialAuth from "./SocialAuth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { termsAndConditions } from "../constants";

const TermsDialog = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
        <div className="space-y-4">
          {termsAndConditions.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              {Array.isArray(section.content) ? (
                <ul className="list-disc pl-6 space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">{section.content}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-[#8EB4CC] text-white rounded-md hover:bg-[#8EB4CC]/80"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error("Please accept the Terms and Conditions to register.");
      return;
    }

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
      <TermsDialog isOpen={showTerms} onClose={() => setShowTerms(false)} />
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 text-[#8EB4CC] border-gray-300 rounded focus:ring-[#8EB4CC]"
            />
            <label htmlFor="terms" className="text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-[#8EB4CC] hover:underline"
              >
                Terms and Conditions
              </button>
            </label>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className={`px-6 py-2.5 w-full text-base font-medium text-white rounded-md transition-colors ${
                !acceptedTerms
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#8EB4CC] hover:bg-[#8EB4CC]/80"
              }`}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <SocialAuth onSuccess={(token) => {
          login(token);
          navigate("/home");
        }} />

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
