"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import {
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
}

interface EmailSettingsFormState {
  from: string;
  replyTo: string;
  resetSubject: string;
  resetHtml: string;
  welcomeSubject: string;
  welcomeHtml: string;
}

type OAuthProviderId = "github" | "google";

interface OAuthFormState {
  enabled: boolean;
}

export default function AdminSettingsPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const updateMyProfile = useMutation(api.admin.updateMyProfile);
  const generateAvatarUploadUrl = useMutation(
    api.admin.generateAvatarUploadUrl,
  );
  const updateAvatar = useMutation(api.admin.updateAvatar);
  const emailSettings = useQuery(
    api.admin.getEmailSettings,
    currentUser?.role === "admin" ? {} : "skip",
  );
  const updateEmailSettings = useMutation(api.admin.updateEmailSettings);
  const oauthSettings = useQuery(
    api.admin.getOAuthSettings,
    currentUser?.role === "admin" ? {} : "skip",
  );
  const updateOAuthSettings = useMutation(api.admin.updateOAuthSettings);

  const [formState, setFormState] = useState<ProfileFormState>({
    name: "",
    email: "",
    phone: "",
  });
  const [emailFormState, setEmailFormState] = useState<EmailSettingsFormState>({
    from: "",
    replyTo: "",
    resetSubject: "",
    resetHtml:
      "<p>Someone requested a password reset for your Nexus account.</p>\n<p><a href='{{resetUrl}}'>Reset your password</a></p>\n<p>If you did not request this, you can ignore this email.</p>",
    welcomeSubject: "",
    welcomeHtml:
      "<p>Welcome to Nexus{{name}},</p>\n<p>Your account is ready. You can sign in anytime to manage your workspace.</p>",
  });
  const [resendApiKey, setResendApiKey] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"reset" | "welcome">(
    "reset",
  );
  const [selectedProvider, setSelectedProvider] =
    useState<OAuthProviderId>("github");
  const [oauthFormState, setOauthFormState] = useState<OAuthFormState>({
    enabled: false,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmailDirty, setIsEmailDirty] = useState(false);
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isOAuthDirty, setIsOAuthDirty] = useState(false);
  const [isOAuthSaving, setIsOAuthSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || isDirty) {
      return;
    }

    setFormState({
      name: currentUser.name ?? "",
      email: currentUser.email ?? "",
      phone: currentUser.phone ?? "",
    });
  }, [currentUser, isDirty]);

  useEffect(() => {
    if (!emailSettings || isEmailDirty) {
      return;
    }

    setEmailFormState({
      from: emailSettings.from ?? "",
      replyTo: emailSettings.replyTo ?? "",
      resetSubject: emailSettings.resetSubject ?? "",
      resetHtml:
        emailSettings.resetHtml ??
        "<p>Someone requested a password reset for your Nexus account.</p>\n<p><a href='{{resetUrl}}'>Reset your password</a></p>\n<p>If you did not request this, you can ignore this email.</p>",
      welcomeSubject: emailSettings.welcomeSubject ?? "",
      welcomeHtml:
        emailSettings.welcomeHtml ??
        "<p>Welcome to Nexus{{name}},</p>\n<p>Your account is ready. You can sign in anytime to manage your workspace.</p>",
    });
  }, [emailSettings, isEmailDirty]);

  useEffect(() => {
    if (!oauthSettings || isOAuthDirty) {
      return;
    }
    const selected = oauthSettings.find(
      (provider) => provider.id === selectedProvider,
    );
    if (!selected) {
      return;
    }
    setOauthFormState({
      enabled: selected.enabled,
    });
  }, [oauthSettings, isOAuthDirty, selectedProvider]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem("nexus.emailTemplate");
    if (stored === "reset" || stored === "welcome") {
      setSelectedTemplate(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("nexus.emailTemplate", selectedTemplate);
  }, [selectedTemplate]);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
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
      setIsDirty(false);
      setSaveMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsEmailSaving(true);
    setEmailMessage(null);

    try {
      await updateEmailSettings({
        provider: "resend",
        from: emailFormState.from,
        replyTo: emailFormState.replyTo,
        resetSubject: emailFormState.resetSubject,
        resetHtml: emailFormState.resetHtml,
        welcomeSubject: emailFormState.welcomeSubject,
        welcomeHtml: emailFormState.welcomeHtml,
        resendApiKey: resendApiKey.trim() || undefined,
      });
      setResendApiKey("");
      setIsEmailDirty(false);
      setEmailMessage({ type: "success", text: "Email settings updated" });
    } catch (error) {
      setEmailMessage({
        type: "error",
        text: "Failed to update email settings",
      });
    } finally {
      setIsEmailSaving(false);
    }
  };

  const handleOAuthSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsOAuthSaving(true);
    setOauthMessage(null);

    try {
      await updateOAuthSettings({
        provider: selectedProvider,
        enabled: oauthFormState.enabled,
      });
      setIsOAuthDirty(false);
      setOauthMessage({ type: "success", text: "OAuth settings updated" });
    } catch (error) {
      setOauthMessage({ type: "error", text: "Failed to update OAuth" });
    } finally {
      setIsOAuthSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setSaveMessage(null);

    try {
      const postUrl = await generateAvatarUploadUrl();

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { storageId } = await response.json();

      await updateAvatar({ storageId });

      setSaveMessage({ type: "success", text: "Avatar updated successfully" });
      setPreviewUrl(null);
    } catch (error) {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setSaveMessage(null);

    try {
      const postUrl = await generateAvatarUploadUrl();

      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { storageId } = await response.json();

      await updateAvatar({ storageId });

      setSaveMessage({ type: "success", text: "Avatar updated successfully" });
      setPreviewUrl(null);
    } catch (error) {
      setSaveMessage({ type: "error", text: "Failed to upload avatar" });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = currentUser?.imageUrl ?? null;
  const resendApiKeySet = emailSettings?.resendApiKeySet ?? false;
  const oauthSettingsLoaded = oauthSettings !== undefined;
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    ? process.env.NEXT_PUBLIC_CONVEX_URL.replace(
        ".convex.cloud",
        ".convex.site",
      )
    : null;
  const oauthCallbackUrl = convexSiteUrl
    ? `${convexSiteUrl}/api/auth/callback/${selectedProvider}`
    : `https://<deployment>.convex.site/api/auth/callback/${selectedProvider}`;

  const initials = (currentUser?.name ?? currentUser?.email ?? "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Account settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal information and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="oauth">OAuth</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile information
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
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
                            {isUploading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
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
                      onChange={(event) => {
                        setIsDirty(true);
                        setFormState((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }));
                      }}
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
                      onChange={(event) => {
                        setIsDirty(true);
                        setFormState((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }));
                      }}
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
                      onChange={(event) => {
                        setIsDirty(true);
                        setFormState((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }));
                      }}
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
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure Resend credentials and templates for transactional
                emails.
              </p>
            </div>
            <form onSubmit={handleEmailSave} className="p-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="resend-api-key"
                      className="flex items-center gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      Resend API key
                    </Label>
                    <Input
                      id="resend-api-key"
                      type="password"
                      value={resendApiKey}
                      onChange={(event) => {
                        setIsEmailDirty(true);
                        setResendApiKey(event.target.value);
                      }}
                      placeholder={resendApiKeySet ? "••••••••••" : "re_"}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {resendApiKeySet
                        ? "Key is stored. Leave blank to keep the current key."
                        : "Add a Resend API key to enable password reset emails."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email-from"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      From address
                    </Label>
                    <Input
                      id="email-from"
                      type="email"
                      value={emailFormState.from}
                      onChange={(event) => {
                        setIsEmailDirty(true);
                        setEmailFormState((prev) => ({
                          ...prev,
                          from: event.target.value,
                        }));
                      }}
                      placeholder="no-reply@yourdomain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email-reply-to"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Reply-to address
                    </Label>
                    <Input
                      id="email-reply-to"
                      type="email"
                      value={emailFormState.replyTo}
                      onChange={(event) => {
                        setIsEmailDirty(true);
                        setEmailFormState((prev) => ({
                          ...prev,
                          replyTo: event.target.value,
                        }));
                      }}
                      placeholder="support@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Template</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) =>
                        setSelectedTemplate(value as "reset" | "welcome")
                      }
                    >
                      <SelectTrigger id="template-select">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reset">Password reset</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-4 space-y-4">
                    {selectedTemplate === "reset" ? (
                      <>
                        <div>
                          <p className="text-sm font-semibold">
                            Password reset template
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Available variables: {"{{resetUrl}}"}, {"{{email}}"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reset-subject">Subject</Label>
                          <Input
                            id="reset-subject"
                            value={emailFormState.resetSubject}
                            onChange={(event) => {
                              setIsEmailDirty(true);
                              setEmailFormState((prev) => ({
                                ...prev,
                                resetSubject: event.target.value,
                              }));
                            }}
                            placeholder="Reset your Nexus password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reset-html">HTML body</Label>
                          <Textarea
                            id="reset-html"
                            rows={6}
                            value={emailFormState.resetHtml}
                            onChange={(event) => {
                              setIsEmailDirty(true);
                              setEmailFormState((prev) => ({
                                ...prev,
                                resetHtml: event.target.value,
                              }));
                            }}
                            placeholder="<p>Reset your password: <a href='{{resetUrl}}'>link</a></p>"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-semibold">
                            Welcome template
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Available variables: {"{{name}}"}, {"{{email}}"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="welcome-subject">Subject</Label>
                          <Input
                            id="welcome-subject"
                            value={emailFormState.welcomeSubject}
                            onChange={(event) => {
                              setIsEmailDirty(true);
                              setEmailFormState((prev) => ({
                                ...prev,
                                welcomeSubject: event.target.value,
                              }));
                            }}
                            placeholder="Welcome to Nexus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="welcome-html">HTML body</Label>
                          <Textarea
                            id="welcome-html"
                            rows={6}
                            value={emailFormState.welcomeHtml}
                            onChange={(event) => {
                              setIsEmailDirty(true);
                              setEmailFormState((prev) => ({
                                ...prev,
                                welcomeHtml: event.target.value,
                              }));
                            }}
                            placeholder="<p>Welcome to Nexus {{name}}</p>"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {emailMessage && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    emailMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
                  }`}
                >
                  {emailMessage.text}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isEmailSaving}
                  className="w-full sm:w-auto"
                >
                  {isEmailSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isEmailSaving ? "Saving..." : "Save email settings"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="oauth">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                OAuth providers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage GitHub and Google sign-in credentials.
              </p>
            </div>
            <form onSubmit={handleOAuthSave} className="p-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oauth-provider">Provider</Label>
                    <Select
                      value={selectedProvider}
                      onValueChange={(value) => {
                        setSelectedProvider(value as OAuthProviderId);
                        setIsOAuthDirty(false);
                        setOauthMessage(null);
                      }}
                    >
                      <SelectTrigger id="oauth-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Enable provider</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Show this provider on the sign-in page.
                      </p>
                    </div>
                    <Switch
                      checked={oauthFormState.enabled}
                      onCheckedChange={(checked) => {
                        setIsOAuthDirty(true);
                        setOauthFormState((prev) => ({
                          ...prev,
                          enabled: checked,
                        }));
                      }}
                      disabled={!oauthSettingsLoaded}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2">
                    <p className="text-sm font-medium">Environment variables</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` and
                      `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` via `npx convex
                      env set`.
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Callback URL:{" "}
                      <span className="font-mono">{oauthCallbackUrl}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <p className="text-sm font-medium">Configured status</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provider buttons show only when env vars are set.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <p className="text-sm font-medium">Configured status</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Provider buttons show only when env vars are set.
                    </p>
                  </div>
                </div>
              </div>

              {oauthMessage && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    oauthMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
                  }`}
                >
                  {oauthMessage.text}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isOAuthSaving || !oauthSettingsLoaded}
                  className="w-full sm:w-auto"
                >
                  {isOAuthSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isOAuthSaving ? "Saving..." : "Save OAuth settings"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
