import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";
import axios from "../api/axios";

const ResetCode = () => {
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetCode = async () => {
    try {
      const response = await axios.post("/user/reset-password", { resetCode });
      console.log(response);
    } catch (error) {
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
          Welcome to Luga.ai
        </h2>

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
