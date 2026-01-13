"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  Save,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
}

export default function AdminSettingsPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});

  if (process.env.NODE_ENV === "development" && currentUser) {
    console.log("Current user:", currentUser);
    console.log(
      "User image field:",
      currentUser.image,
      typeof currentUser.image,
    );
  }
  const updateMyProfile = useMutation(api.admin.updateMyProfile);
  const generateAvatarUploadUrl = useMutation(
    api.admin.generateAvatarUploadUrl,
  );
  const updateAvatar = useMutation(api.admin.updateAvatar);

  const [formState, setFormState] = useState<ProfileFormState>({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (currentUser === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Sign in to access settings.
      </div>
    );
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateMyProfile({
        name: formState.name.trim() || undefined,
        email: formState.email.trim() || undefined,
        phone: formState.phone.trim() || undefined,
      });
      setSaveMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Starting avatar upload:", file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setSaveMessage(null);

    try {
      console.log("Generating upload URL...");
      const postUrl = await generateAvatarUploadUrl();
      console.log("Upload URL generated:", postUrl.substring(0, 50) + "...");

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { storageId } = await response.json();
      console.log("Storage ID received:", storageId, typeof storageId);

      await updateAvatar({ storageId });
      console.log("Avatar mutation completed");

      setSaveMessage({ type: "success", text: "Avatar updated successfully" });
      setPreviewUrl(null);
    } catch (error) {
      console.error("Avatar upload error:", error);
      setSaveMessage({ type: "error", text: "Failed to upload avatar" });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setSaveMessage({ type: "error", text: "Please upload an image file" });
      return;
    }

    console.log("Starting avatar drop:", file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setSaveMessage(null);

    try {
      console.log("Generating upload URL...");
      const postUrl = await generateAvatarUploadUrl();
      console.log("Upload URL generated:", postUrl.substring(0, 50) + "...");

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { storageId } = await response.json();
      console.log("Storage ID received:", storageId, typeof storageId);

      await updateAvatar({ storageId });
      console.log("Avatar mutation completed");

      setSaveMessage({ type: "success", text: "Avatar updated successfully" });
      setPreviewUrl(null);
    } catch (error) {
      console.error("Avatar drop error:", error);
      setSaveMessage({ type: "error", text: "Failed to upload avatar" });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getAvatarUrl = () => {
    if (currentUser?.image) {
      const image = currentUser.image;
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      console.log("Convex URL from env:", convexUrl);
      console.log("Image value:", image, typeof image);

      if (typeof image === "string") {
        if (image.startsWith("http")) {
          console.log("Using external URL");
          return image;
        }
        console.log("Using storage URL for ID:", image);
        return `${convexUrl}/api/storage/${image}`;
      } else {
        console.log("Using storage URL for ID object:", String(image));
        return `${convexUrl}/api/storage/${image}`;
      }
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  const initials = (currentUser?.name ?? currentUser?.email ?? "U")
    .slice(0, 2)
    .toUpperCase();

  if (process.env.NODE_ENV === "development" && avatarUrl) {
    console.log("Full avatar URL:", avatarUrl);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Account settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile information
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-6">
            <div
              className="relative group"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-800 shadow-lg">
                  <AvatarImage
                    src={previewUrl ?? avatarUrl ?? undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-28 w-28 rounded-full bg-black/50 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 rounded-full">
                  <div className="h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-sm font-medium">
                  {currentUser?.name ?? currentUser?.email ?? "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser?.role ?? "viewer"}
                </p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Drag and drop an image here, or click to browse
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isUploading}
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="h-3 w-3" />
                      {isUploading ? "Uploading..." : "Upload"}
                    </span>
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {(avatarUrl || previewUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setPreviewUrl(null);
                      await updateAvatar({ storageId: undefined });
                      setSaveMessage({
                        type: "success",
                        text: "Avatar removed",
                      });
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Display name
              </Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {saveMessage && (
              <div
                className={`text-sm p-3 rounded-lg ${
                  saveMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
