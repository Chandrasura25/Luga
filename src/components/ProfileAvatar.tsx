import React, { useRef } from "react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Upload } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../components/auth";
import axiosPrivate from "../api/axios";

interface ProfileAvatarProps {
  profileImage: string | null;
  setUser: (user: any) => void;
}

const ProfileAvatar = ({ profileImage, setUser }: ProfileAvatarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { getUserEmail } = useAuth();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload a valid image file (JPEG, PNG, or GIF)",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", getUserEmail() || "");

      try {
        const response = await axiosPrivate.post(
          "/user/profile/upload-image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setUser((prev: any) => ({
          ...prev,
          profileImage: response.data.image_url,
        }));

        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
      }
    }
  };
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 bg-purple-500 text-white text-xl">
        <AvatarImage src={profileImage || ""} alt="Profile" />
        <AvatarFallback>
          {getUserEmail()?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-gray-500 mb-2">
          Adding a picture helps others recognize you. Max size: 5MB.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleUploadClick}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ProfileAvatar;
