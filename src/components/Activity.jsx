import { useEffect, useState } from "react";
import { axiosPrivate } from "../api/axios";
import { useAuth } from "../components/auth";

const Activity = () => {
  const { getUserEmail } = useAuth();
  const [userInfo, setUserInfo] = useState(null);

  const getBalance = async () => {
    try {
      const response = await axiosPrivate.post("/user/balance", {
        user_email: getUserEmail(),
      });
      setUserInfo(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBalance();
  }, []);
  return (
    <div className="flex-1 flex space-x-4">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center min-h-screen justify-center p-6">
          {userInfo && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-2xl p-8 max-w-md w-full transform transition-all hover:scale-105 ">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">
                User Activity
              </h1>
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Subscription Plan:</span>{" "}
                  {userInfo.subscription_plan}
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    Balance:
                  </p>
                  {userInfo.balance && (
                    <div className="space-y-3">
                      {userInfo.balance.text_quota !== undefined && (
                        <p className="text-gray-700">
                          <span className="font-medium">Test Quota:</span>{" "}
                          {userInfo.balance.text_quota === -1
                            ? "Unlimited"
                            : userInfo.balance.text_quota}
                        </p>
                      )}
                      {userInfo.balance.audio_quota !== undefined && (
                        <p className="text-gray-700">
                          <span className="font-medium">Audio Quota:</span>{" "}
                          {userInfo.balance.audio_quota / 60} minutes
                        </p>
                      )}
                      {userInfo.balance.video_quota !== undefined && (
                        <p className="text-gray-700">
                          <span className="font-medium">Video Quota:</span>{" "}
                          {userInfo.balance.video_quota / 60} minutes
                        </p>
                      )}
                      {userInfo.balance.process_video_quota !== undefined && (
                        <p className="text-gray-700">
                          <span className="font-medium">
                            Process Video Quota:
                          </span>{" "}
                          {userInfo.balance.process_video_quota}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Activity;
