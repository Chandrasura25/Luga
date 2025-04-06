import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import axios from "../api/axios";
import { toast } from "react-toastify";

interface GoogleResponse {
  credential: string;
}

interface FacebookAuthResponse {
  authResponse?: {
    accessToken: string;
  };
}

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    username: string;
    password: string;
    google_id?: string;
    facebook_id?: string;
  };
  setUser: (user: any) => void;
}

const ProfileForm = ({ user, setUser }: ProfileFormProps) => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || "",
  });

  // Social login states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [isFBInitialized, setIsFBInitialized] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUser({
      ...user,
      ...formData,
    });
    setLoading(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return; // Add error handling for password mismatch
    }
    setUser({
      ...user,
      currentPassword,
      newPassword,
    });
    setIsPasswordDialogOpen(false);
    
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleUnlinkSocial = async (platform: string) => {
    try {
      await axios.post("/user/profile/unlink-social", {
        email: user.email,
        platform
      });
      
      setUser({
        ...user,
        [`${platform}_id`]: undefined
      });
      
      toast.success(`${platform} account unlinked successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to unlink ${platform} account`);
    }
  };

  const handleGoogleLink = async (response: GoogleResponse) => {
    setGoogleLoading(true);
    try {
      const result = await axios.post("/user/auth/google", {
        token: response.credential
      });
      
      if (result.data.user) {
        setUser({
          ...user,
          google_id: result.data.user.google_id
        });
        toast.success("Google account linked successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to link Google account");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLink = async (response: FacebookAuthResponse["authResponse"]) => {
    if (!response) return; // Add null check for response
    setFacebookLoading(true);
    try {
      const result = await axios.post("/user/auth/facebook", {
        access_token: response.accessToken
      });
      
      if (result.data.user) {
        setUser({
          ...user,
          facebook_id: result.data.user.facebook_id
        });
        toast.success("Facebook account linked successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to link Facebook account");
    } finally {
      setFacebookLoading(false);
    }
  };

  // Initialize social SDKs
  useEffect(() => {
    // Add FB SDK initialization check
    if (window.FB) {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      setIsFBInitialized(true);
    } else {
      // If FB SDK is not loaded yet, wait for it
      window.fbAsyncInit = function() {
        window.FB?.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || "",
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        setIsFBInitialized(true);
      };
    }
  }, []);

  // Separate useEffect for Google initialization
  useEffect(() => {
    const googleEl = document.getElementById("google-link-button");
    if (window.google?.accounts && !user.google_id && googleEl) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: handleGoogleLink
      });

      window.google.accounts.id.renderButton(
        googleEl,
        { theme: "outline", size: "large", text: "link_with" }
      );
    }
  }, [user.google_id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={user.email}
          disabled
          className="bg-gray-50"
        />
        <p className="text-sm text-gray-500">
          Your email address is your identity on Luga AI and cannot be changed.
        </p>
      </div>
      
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
        />
      </div>
      
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="flex items-center gap-2">
          <Input
            type="password"
            id="password"
            value="********"
            disabled
            className="bg-gray-50"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            Change
          </Button>
        </div>
      </div>

      {/* Social Accounts Section */}
      <div className="grid w-full items-center gap-1.5">
        <Label>Connected Accounts</Label>
        
        {/* Google Account */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.607,1.972-2.101,3.467-4.073,4.073v-3.536c0-1.054-0.855-1.909-1.909-1.909h-3.536c0.607-1.972,2.101-3.467,4.073-4.073v3.536C12.545,10.097,13.4,10.952,12.545,12.151z M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z M12,20c-4.418,0-8-3.582-8-8s3.582-8,8-8s8,3.582,8,8S16.418,20,12,20z"/>
            </svg>
            <span>Google</span>
          </div>
          {user.google_id ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleUnlinkSocial("google")}
              className="text-red-600 hover:text-red-700"
            >
              Unlink
            </Button>
          ) : (
            <div id="google-link-button"></div>
          )}
        </div>

        {/* Facebook Account */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </div>
          {user.facebook_id ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleUnlinkSocial("facebook")}
              className="text-red-600 hover:text-red-700"
            >
              Unlink
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={facebookLoading || !isFBInitialized}
              onClick={() => {
                if (window.FB && isFBInitialized) {
                  window.FB.login((response) => {
                    if (response.authResponse) {
                      handleFacebookLink(response.authResponse);
                    }
                  }, { scope: 'email,public_profile' });
                } else {
                  toast.error("Facebook SDK is not initialized yet. Please try again in a moment.");
                }
              }}
            >
              {facebookLoading ? "Linking..." : "Link"}
            </Button>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default ProfileForm;