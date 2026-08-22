"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

/** Customer authentication tabs handling email/password sign-in and account creation. */
export function AuthForms() {

  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.signIn.email({
      email: signIn.email,
      password: signIn.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Sign in failed");
      return;
    }
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.signUp.email({
      name: signUp.name,
      email: signUp.email,
      password: signUp.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message || "Sign up failed");
      return;
    }
    router.refresh();
  };

  return (
    <Tabs defaultValue="signin">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign in</TabsTrigger>
        <TabsTrigger value="signup">Create account</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <form onSubmit={handleSignIn} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="si-email">Email</Label>
            <Input
              id="si-email"
              type="email"
              required
              value={signIn.email}
              onChange={(e) => setSignIn((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="si-password">Password</Label>
            <Input
              id="si-password"
              type="password"
              required
              value={signIn.password}
              onChange={(e) => setSignIn((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Sign in
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="signup">
        <form onSubmit={handleSignUp} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="su-name">Full name</Label>
            <Input
              id="su-name"
              required
              value={signUp.name}
              onChange={(e) => setSignUp((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-email">Email</Label>
            <Input
              id="su-email"
              type="email"
              required
              value={signUp.email}
              onChange={(e) => setSignUp((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-password">Password (min 8 characters)</Label>
            <Input
              id="su-password"
              type="password"
              required
              minLength={8}
              value={signUp.password}
              onChange={(e) => setSignUp((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Create account
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
