import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileForm from "../components/ProfileForm";
import TwoFactorToggle from "../components/TwoFactorToggle";
import SocialAccounts from "../components/SocialAccounts";
import InviteFriends from "../components/InviteFriends";

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState({
    name: "zhuonut.fu",
    email: "zhuonut.fu@gmail.com",
    password: "********",
    twoFactorEnabled: false,
    profileImage: null as string | null,
  });

  const handleDeleteAccount = () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (confirm) {
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center w-full">
      <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <Card className="p-6 shadow-sm bg-white">
          <div className="space-y-6">
            <ProfileAvatar profileImage={user.profileImage} setUser={setUser} />

            <ProfileForm user={user} setUser={setUser} />

            <TwoFactorToggle
              enabled={user.twoFactorEnabled}
              setUser={setUser}
            />

            <SocialAccounts />

            <div className="pt-2">
              <Button
                variant="outline"
                className="text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
                onClick={handleDeleteAccount}
              >
                Delete my account
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <InviteFriends />
        </div>
      </div>
    </div>
  );
};

export default Profile;
