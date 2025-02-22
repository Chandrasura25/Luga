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
      <div className="max-w-[350px] flex flex-col gap-4">
        <h2 className="text-2xl font-medium text-center">Welcome to Luga.ai</h2>
        <p className="text-sm text-center mb-4">
          Enter the code sent to your email
        </p>

        <form onSubmit={handleResetCode} className="space-y-4">
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
          <div className="flex items-center justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors w-full"
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
