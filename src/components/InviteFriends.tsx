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
    <Card className="p-4 bg-amber-50 border-amber-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GiftIcon className="h-6 w-6 text-amber-400" />
          <span className="text-amber-700 font-medium">
            Invite friends and teammates to HeyGen!
          </span>
        </div>
        
        <Button 
          onClick={copyInvitation}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {copied ? "Copied!" : "Copy Invitation"}
        </Button>
      </div>
    </Card>
  );
};

export default InviteFriends;