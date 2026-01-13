"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  KeyRound,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthFlow = "signIn" | "signUp" | "reset";

type PasswordCheck = {
  label: string;
  passes: boolean;
};

type PasswordStrength = {
  score: number;
  label: string;
  textClass: string;
  barClass: string;
  checks: PasswordCheck[];
};

const strengthScale = [
  { label: "Very weak", textClass: "text-rose-600", barClass: "bg-rose-500" },
  { label: "Weak", textClass: "text-rose-600", barClass: "bg-rose-500" },
  { label: "Fair", textClass: "text-amber-600", barClass: "bg-amber-500" },
  { label: "Good", textClass: "text-lime-600", barClass: "bg-lime-500" },
  {
    label: "Strong",
    textClass: "text-emerald-600",
    barClass: "bg-emerald-500",
  },
];

const buildPasswordStrength = (password: string): PasswordStrength => {
  const checks: PasswordCheck[] = [
    { label: "At least 8 characters", passes: password.length >= 8 },
    { label: "Uppercase letter", passes: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passes: /[a-z]/.test(password) },
    { label: "Number or symbol", passes: /[0-9]|[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((check) => check.passes).length;
  const strength = strengthScale[score];
  return {
    score,
    label: strength.label,
    textClass: strength.textClass,
    barClass: strength.barClass,
    checks,
  };
};

type AuthPageProps = {
  initialFlow?: AuthFlow;
};

export function AuthPage({ initialFlow = "signIn" }: AuthPageProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<AuthFlow>(initialFlow);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [rememberUsername, setRememberUsername] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("rememberedUsername");
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberUsername(true);
    }
  }, []);

  useEffect(() => {
    setFlow(initialFlow);
  }, [initialFlow]);

  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [flow]);

  const applyFlowChange = (nextFlow: AuthFlow) => {
    if (nextFlow === "signUp") {
      router.push("/signup");
    }
    if (nextFlow === "signIn") {
      router.push("/signin");
    }
    setFlow(nextFlow);
  };

  const normalizedUsername = useMemo(
    () => username.trim().toLowerCase(),
    [username],
  );
  const shouldCheckUsername =
    flow === "signUp" && normalizedUsername.length >= 3;
  const usernameAvailable = useQuery(
    api.myFunctions.checkUsernameAvailability,
    shouldCheckUsername ? { username: normalizedUsername } : "skip",
  );

  const passwordStrength = useMemo(
    () => buildPasswordStrength(password),
    [password],
  );

  const usernameStatus = !shouldCheckUsername
    ? "idle"
    : usernameAvailable === undefined
      ? "checking"
      : usernameAvailable
        ? "available"
        : "taken";

  const canSubmit =
    flow !== "signUp" || (shouldCheckUsername && usernameAvailable === true);

  const title =
    flow === "signIn"
      ? "Welcome back"
      : flow === "signUp"
        ? "Create your account"
        : "Reset your password";

  const subtitle =
    flow === "signIn"
      ? "Sign in to manage your workspace."
      : flow === "signUp"
        ? "Choose a username and set a strong password."
        : "We will send a password reset link to your email.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </CardDescription>
          {flow !== "reset" && (
            <Tabs
              value={flow}
              onValueChange={(value) => applyFlowChange(value as AuthFlow)}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signIn">Sign in</TabsTrigger>
                <TabsTrigger value="signUp">Sign up</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              setNotice(null);

              const formData = new FormData(event.target as HTMLFormElement);
              formData.set("flow", flow);
              formData.set("email", email.trim());

              if (flow === "signUp") {
                formData.set("name", normalizedUsername);
              }

              if (flow === "signIn") {
                if (rememberUsername) {
                  localStorage.setItem("rememberedUsername", email.trim());
                } else {
                  localStorage.removeItem("rememberedUsername");
                }
              }

              void signIn("password", formData)
                .then(() => {
                  if (flow === "reset") {
                    setNotice(
                      "If an account exists, a reset link has been sent.",
                    );
                    return;
                  }
                  router.push("/admin");
                })
                .catch((signInError) => {
                  setError(signInError.message);
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-700 dark:text-slate-300"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  className="pl-10"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            {flow === "signUp" && (
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    className="pl-10"
                    type="text"
                    name="name"
                    placeholder="Choose a unique username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {usernameStatus === "idle" && "Use at least 3 characters."}
                  {usernameStatus === "checking" && "Checking availability..."}
                  {usernameStatus === "available" && "Username is available."}
                  {usernameStatus === "taken" && "Username is taken."}
                </div>
              </div>
            )}

            {flow !== "reset" && (
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    className="pl-10"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    minLength={8}
                    autoComplete={
                      flow === "signUp" ? "new-password" : "current-password"
                    }
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                {flow === "signUp" && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-300">
                        Password strength
                      </span>
                      <span className={passwordStrength.textClass}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <span
                          key={`strength-${index}`}
                          className={`h-1.5 rounded-full transition-all ${
                            index < passwordStrength.score
                              ? passwordStrength.barClass
                              : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {passwordStrength.checks.map((check) => (
                        <span
                          key={check.label}
                          className={
                            check.passes
                              ? "text-emerald-600 dark:text-emerald-400"
                              : undefined
                          }
                        >
                          {check.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {flow === "signIn" && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-username"
                    checked={rememberUsername}
                    onCheckedChange={(checked) =>
                      setRememberUsername(Boolean(checked))
                    }
                  />
                  <Label
                    htmlFor="remember-username"
                    className="text-slate-600 dark:text-slate-400"
                  >
                    Remember username
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-slate-700 dark:text-slate-300"
                  onClick={() => setFlow("reset")}
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={loading || !canSubmit}
            >
              {loading
                ? "Working..."
                : flow === "signIn"
                  ? "Sign in"
                  : flow === "signUp"
                    ? "Create account"
                    : "Send reset link"}
              {flow === "reset" && <KeyRound className="h-4 w-4" />}
            </Button>

            {flow === "reset" && (
              <div className="flex flex-row gap-2 text-sm justify-center">
                <span className="text-slate-600 dark:text-slate-400">
                  Remembered your password?
                </span>
                <button
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium underline decoration-2 underline-offset-2 hover:no-underline"
                  type="button"
                  onClick={() => applyFlowChange("signIn")}
                >
                  Back to sign in
                </button>
              </div>
            )}

            {notice && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-emerald-700">
                  Check your inbox
                </AlertTitle>
                <AlertDescription className="text-emerald-700">
                  {notice}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return <AuthPage />;
}
