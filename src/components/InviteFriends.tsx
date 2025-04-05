import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../components/auth";
import { axiosPrivate } from "../api/axios";
import { Copy, Check } from "lucide-react";

const InviteFriends = () => {
  const { toast } = useToast();
  const { getUserEmail } = useAuth();
  const [invitationCode, setInvitationCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvitationCode = async () => {
    setIsGenerating(true);
    try {
      const response = await axiosPrivate.post("/user/profile/generate-invitation", {
        email: getUserEmail(),
      });
      setInvitationCode(response.data.invitation_code);
      toast({
        title: "Success",
        description: "Invitation code generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invitation code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
      setIsCopied(true);
      toast({
        title: "Success",
        description: "Invitation code copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy invitation code",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 shadow-sm bg-white">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Invite Friends</h3>
          <p className="text-sm text-gray-500">
            Generate a unique invitation code to share with your friends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={invitationCode}
            placeholder="Generate an invitation code"
            readOnly
          />
          {invitationCode ? (
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              onClick={generateInvitationCode}
              disabled={isGenerating}
              className="shrink-0"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          )}
        </div>

        {invitationCode && (
          <p className="text-sm text-gray-500">
            Share this code with your friends to invite them to Luga AI.
          </p>
        )}
      </div>
    </Card>
  );
};

export default InviteFriends;