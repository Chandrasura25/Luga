import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { GiftIcon } from "../components/icons/GiftIcon";
import { useToast } from "../hooks/use-toast";

const InviteFriends = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const inviteLink = "https://example.com/invite/user123";
  
  const copyInvitation = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    
    toast({
      title: "Invitation link copied",
      description: "The invitation link has been copied to your clipboard.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="p-4 bg-blue-50 border-blue-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GiftIcon className="h-6 w-6 text-blue-500" />
          <span className="text-blue-700 font-medium">
            Invite friends and teammates to Luca AI!
          </span>
        </div>
        
        <Button 
          onClick={copyInvitation}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {copied ? "Copied!" : "Copy Invitation"}
        </Button>
      </div>
    </Card>
  );
};

export default InviteFriends;