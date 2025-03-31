
import React from "react";
import { Label } from "../components/ui/label";
import { FaceSmileIcon } from "../components/icons/FaceSmileIcon";
import { GoogleIcon } from "../components/icons/GoogleIcon";

const SocialAccounts = () => {
  return (
    <div className="space-y-3">
      <Label>Associated account</Label>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-2 flex-1">
          <GoogleIcon className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Google</span>
            <span className="text-xs text-gray-500">Not connected</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-2 flex-1">
          <FaceSmileIcon className="h-5 w-5 text-blue-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Facebook</span>
            <span className="text-xs text-gray-500">Not connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAccounts;