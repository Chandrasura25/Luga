import { Label } from "../components/ui/label";
import { useState, useEffect } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import { Button } from "./ui/button";
import { ProfileFormProps } from "./ProfileForm";
interface GoogleResponse {
  credential: string;
}
const SocialAccounts = ({ user, setUser }: ProfileFormProps) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const handleUnlinkSocial = async (platform: string) => {
    try {
      await axios.post("/user/profile/unlink-social", {
        email: user.email,
        platform,
      });

      setUser({
        ...user,
        [`${platform}_id`]: undefined,
      });

      toast.success(`${platform} account unlinked successfully`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || `Failed to unlink ${platform} account`
      );
    }
  };

  const handleGoogleLink = async (response: GoogleResponse) => {
    setGoogleLoading(true);
    try {
      const result = await axios.post("/user/auth/google", {
        token: response.credential,
      });

      if (result.data.user) {
        setUser({
          ...user,
          google_id: result.data.user.google_id,
        });
        toast.success("Google account linked successfully");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to link Google account"
      );
    } finally {
      setGoogleLoading(false);
    }
  };
  // Separate useEffect for Google initialization
  useEffect(() => {
    const googleEl = document.getElementById("google-link-button");
    if (window.google?.accounts && !user.google_id && googleEl) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: handleGoogleLink,
      });

      window.google.accounts.id.renderButton(googleEl, {
        theme: "outline",
        size: "large",
        text: "link_with",
      });
    }
  }, [user.google_id]);
  return (
    <div className="space-y-3">
      <Label>Associated account</Label>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col">
          {user.google_id ? (
            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={() => handleUnlinkSocial("google")}
              className="text-red-600 hover:text-red-700"
            >
              Unlink
            </Button>
          ) : (
            <div id="google-link-button"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialAccounts;
