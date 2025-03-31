import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";

interface TwoFactorToggleProps {
  enabled: boolean;
  setUser: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    twoFactorEnabled: boolean;
    profileImage: string | null;
  }>>;
}

const TwoFactorToggle = ({ enabled, setUser }: TwoFactorToggleProps) => {
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

  const enableTwoFactor = () => {
    setIsEnabling(true);
    // Simulate enabling process
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        twoFactorEnabled: true
      }));
      setIsEnabling(false);
      toast({
        title: "Two-factor authentication enabled",
        description: "Your account is now more secure.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-2">
      <Label>Two-factor authentication</Label>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-500">
          {enabled 
            ? "Two-factor authentication is on" 
            : "Two-factor authentication is off"}
        </div>
        {!enabled && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={enableTwoFactor}
            disabled={isEnabling}
          >
            {isEnabling ? "Enabling..." : "Enable"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TwoFactorToggle;
