import React from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    password: string;
    twoFactorEnabled: boolean;
    profileImage: string | null;
  };
  setUser: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    twoFactorEnabled: boolean;
    profileImage: string | null;
  }>>;
}

const ProfileForm = ({ user, setUser }: ProfileFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={user.name}
          onChange={handleChange}
        />
      </div>
      
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={user.email}
          onChange={handleChange}
        />
      </div>
      
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          id="password"
          name="password"
          value={user.password}
          onChange={handleChange}
          readOnly
        />
      </div>
    </div>
  );
};

export default ProfileForm;