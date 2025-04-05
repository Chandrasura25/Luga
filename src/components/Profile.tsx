import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../components/auth";
import { axiosPrivate } from "../api/axios";
import ProfileAvatar from "../components/ProfileAvatar";
import ProfileForm from "../components/ProfileForm";
import TwoFactorToggle from "../components/TwoFactorToggle";
import SocialAccounts from "../components/SocialAccounts";
import InviteFriends from "../components/InviteFriends";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { QRCodeSVG } from "qrcode.react";

const Profile = () => {
  const { toast } = useToast();
  const { getUserEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [user, setUser] = useState({
    name: "",
    email: "",
    username: "",
    password: "********",
    twoFactorEnabled: false,
    profileImage: null as string | null,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosPrivate.post("/user/profile", {
        email: getUserEmail()
      });
      setUser({
        name: response.data.username || "",
        email: response.data.email,
        username: response.data.username || "",
        password: "********",
        twoFactorEnabled: response.data.two_factor_enabled || false,
        profileImage: response.data.profile_image,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile information",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (updatedUser: typeof user) => {
    setIsLoading(true);
    try {
      await axiosPrivate.post("/user/profile/update", {
        email: getUserEmail(),
        username: updatedUser.username,
      });
      setUser(updatedUser);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAToggle = async () => {
    setIsLoading(true);
    try {
      if (!user.twoFactorEnabled) {
        // Enable 2FA
        const response = await axiosPrivate.post("/user/profile/enable-2fa", {
          email: getUserEmail(),
        });
        setQrCodeUri(response.data.provisioning_uri);
        setIs2FADialogOpen(true);
      } else {
        // Disable 2FA
        setIs2FADialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle 2FA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      if (!user.twoFactorEnabled) {
        // Enable 2FA
        await axiosPrivate.post("/user/profile/verify-2fa", {
          email: getUserEmail(),
          code: twoFactorCode,
        });
        setUser({ ...user, twoFactorEnabled: true });
        toast({
          title: "Success",
          description: "2FA enabled successfully",
        });
      } else {
        // Disable 2FA
        await axiosPrivate.post("/user/profile/disable-2fa", {
          email: getUserEmail(),
          code: twoFactorCode,
        });
        setUser({ ...user, twoFactorEnabled: false });
        toast({
          title: "Success",
          description: "2FA disabled successfully",
        });
      }
      setIs2FADialogOpen(false);
      setTwoFactorCode("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axiosPrivate.post("/user/profile/delete-account", {
        email: getUserEmail(),
        password: deletePassword,
        confirmation: deleteConfirmation,
      });
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please check your password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center w-full">
      <div className="container max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <Card className="p-6 shadow-sm bg-white">
          <div className="space-y-6">
            <ProfileAvatar profileImage={user.profileImage} setUser={setUser} />
            <ProfileForm user={user} setUser={handleProfileUpdate} />
            <TwoFactorToggle enabled={user.twoFactorEnabled} onToggle={handle2FAToggle} />
            <SocialAccounts />
            <div className="pt-2">
              <Button
                variant="outline"
                className="text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete my account
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <InviteFriends />
        </div>

        {/* Delete Account Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription className="text-red-500">
                Warning: This action cannot be undone. All your data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.checked)}
                />
                <Label htmlFor="confirm">
                  I understand that this action is irreversible
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!deletePassword || !deleteConfirmation}
              >
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2FA Dialog */}
        <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </DialogTitle>
              <DialogDescription>
                {user.twoFactorEnabled
                  ? "Please enter your 2FA code to disable two-factor authentication"
                  : "Scan the QR code with your authenticator app and enter the code below"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!user.twoFactorEnabled && qrCodeUri && (
                <div className="flex justify-center">
                  <QRCodeSVG value={qrCodeUri} size={200} />
                </div>
              )}
              <div>
                <Label htmlFor="2fa-code">Verification Code</Label>
                <Input
                  id="2fa-code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIs2FADialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerify2FA} disabled={!twoFactorCode}>
                {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;
