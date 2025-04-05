import React from "react";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

interface TwoFactorToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const TwoFactorToggle = ({ enabled, onToggle }: TwoFactorToggleProps) => {
  return (
    <div className="space-y-3">
      <Label>Two-factor authentication</Label>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">
            {enabled ? "Enabled" : "Disabled"}
          </p>
          <p className="text-sm text-gray-500">
            Add an extra layer of security to your account by requiring both your password and an authentication code from your mobile device.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label="Toggle 2FA"
        />
      </div>
    </div>
  );
};

export default TwoFactorToggle;
