import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";

const ResetCode = () => {
  const [resetCode, setResetCode] = useState("");

  const handleResetCode = (event) => {
    event.preventDefault();
    // Logic to handle the reset code submission
    console.log("Reset Code Submitted:", resetCode);
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
          <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetCode;
