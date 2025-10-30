"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Mail, Phone, MapPin } from "lucide-react";

interface UserData {
  username?: string;
  email?: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  bio?: string;
  preferences?: {
    genres?: string[];
  };
}

interface UserProfile {
  username: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  bio: string;
}

interface ProfileInfoSectionProps {
  userData: UserData;
  profile: UserProfile;
  onEditProfile: () => void;
}

export function ProfileInfoSection({
  userData,
  profile,
  onEditProfile,
}: ProfileInfoSectionProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Information</CardTitle>
          <Button variant="ghost" size="icon" onClick={onEditProfile}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit profile</span>
          </Button>
        </div>
        <CardDescription>Your seller account details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={profile.avatar || "/placeholder.svg"}
              alt={profile.username}
            />
            <AvatarFallback>
              {profile.username
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{profile.username}</h3>
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{profile.location}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {userData?.preferences?.genres?.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
