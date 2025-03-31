import React, { useRef } from "react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Upload } from "lucide-react";

interface ProfileAvatarProps {
  profileImage: string | null;
  setUser: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    twoFactorEnabled: boolean;
    profileImage: string | null;
  }>>;
}

const ProfileAvatar = ({ profileImage, setUser }: ProfileAvatarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUser(prev => ({
            ...prev,
            profileImage: event.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 bg-purple-500 text-white text-xl">
        <AvatarImage src={profileImage || ""} alt="Profile" />
        <AvatarFallback>Z</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm text-gray-500 mb-2">
          Adding a picture makes it much easier for members to recognize you.
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
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ProfileAvatar;