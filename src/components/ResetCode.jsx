import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import logo from "../assets/logo.jpeg";

const ResetCode = () => {
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post("/user/reset-password", {
        reset_code: resetCode,
      });
      if (response.status === 200) {
        localStorage.setItem("email", response.data.email);
        navigate("/reset-password");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response.data.detail,
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
        <h2 className="text-2xl font-medium">Welcome to Luga AI</h2>
        <p className="text-sm mb-4">
          Enter the code sent to your email
        </p>

        <form onSubmit={handleResetCode} className="space-y-4 w-full flex justify-center flex-col items-center">
          <InputOTP maxLength={6} onChange={setResetCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="flex w-full items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 w-full text-base font-medium text-white bg-[#8EB4CC] rounded-md hover:bg-[#8EB4CC]/80 transition-colors"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetCode;
