import { useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="max-w-[350px] flex flex-col gap-4">
        <h2 className="text-2xl font-medium text-center mb-2">
          Welcome to Luga.ai
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            className="w-full p-3 rounded-lg bg-gray-50"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            value={password}
            className="w-full p-3 rounded-lg bg-gray-50"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
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
