"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

/** Customer and administrator authentication interface with password reveal and demo quick-fill. */
export function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });

  const fillDemoAdmin = () => {
    setTab("signin");
    setSignInData({
      email: "admin@kidora.store",
      password: "kidora2026",
    });
    toast.success("Loaded admin credentials into form");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({
        email: signInData.email.trim(),
        password: signInData.password,
      });
      if (error) {
        toast.error(error.message || "Invalid email or password");
        return;
      }
      toast.success("Welcome back!");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({
        name: signUpData.name.trim(),
        email: signUpData.email.trim(),
        password: signUpData.password,
      });
      if (error) {
        toast.error(error.message || "Failed to create account");
        return;
      }
      toast.success("Account created successfully!");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-muted/60 p-1 ring-1 ring-border/50">
        <button
          type="button"
          onClick={() => setTab("signin")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200",
            tab === "signin"
              ? "bg-background text-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={cn(
            "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200",
            tab === "signup"
              ? "bg-background text-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Create account
        </button>
      </div>

      {tab === "signin" ? (
        <form onSubmit={handleSignIn} className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="si-email" className="text-xs font-semibold text-foreground/90">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="si-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={signInData.email}
                onChange={(e) => setSignInData((f) => ({ ...f, email: e.target.value }))}
                className="h-10.5 pl-9.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="si-password" className="text-xs font-semibold text-foreground/90">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="si-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={signInData.password}
                onChange={(e) => setSignInData((f) => ({ ...f, password: e.target.value }))}
                className="h-10.5 pr-10 pl-9.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="h-11 w-full gap-2 font-semibold">
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>Sign in to account</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {/* Quick Demo Login Option */}
          <div className="pt-2">
            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-border/60" />
              <span className="absolute bg-card px-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                Admin access
              </span>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-500/10 dark:text-purple-300"
            >
              <ShieldCheck className="size-3.5" />
              <span>Fill Store Admin Credentials</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="su-name" className="text-xs font-semibold text-foreground/90">
              Full name
            </Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="su-name"
                required
                autoComplete="name"
                placeholder="Ibrahim Taiwo"
                value={signUpData.name}
                onChange={(e) => setSignUpData((f) => ({ ...f, name: e.target.value }))}
                className="h-10.5 pl-9.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="su-email" className="text-xs font-semibold text-foreground/90">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="su-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={signUpData.email}
                onChange={(e) => setSignUpData((f) => ({ ...f, email: e.target.value }))}
                className="h-10.5 pl-9.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="su-password" className="text-xs font-semibold text-foreground/90">
              Create password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="su-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={signUpData.password}
                onChange={(e) => setSignUpData((f) => ({ ...f, password: e.target.value }))}
                className="h-10.5 pr-10 pl-9.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3 text-emerald-500" /> Must be at least 8 characters
            </p>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="h-11 w-full gap-2 font-semibold">
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Create my account</span>
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
