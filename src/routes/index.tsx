import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Traces of Joy — Expense Tracker" },
      {
        name: "description",
        content:
          "Track daily and monthly spending, category analytics and your expense history in a secure cloud account.",
      },
      { property: "og:title", content: "Traces of Joy — Expense Tracker" },
      {
        property: "og:description",
        content: "Monitor spending, analyse categories and keep your expense records synced to the cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/dashboard" });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. user@example.com).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          toast.success("Account created — welcome!");
          void navigate({ to: "/dashboard" });
        } else {
          toast.success("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) throw signInError;
        toast.success("Signed in successfully!");
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="space-y-6 text-center md:text-left">
          <div className="neon-panel inline-flex items-center gap-3 px-4 py-2">
            <span className="neon-glow flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold uppercase tracking-wider">Expense Tracker</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Take Control of Your{" "}
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                Daily Expenses
              </span>
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground md:mx-0">
              Monitor daily and monthly spending, track category analytics, keep a full expense history and
              sync everything securely to your own cloud account.
            </p>
          </div>
        </div>

        <div className="neon-panel neon-glow-lg overflow-hidden">
          <div className="border-b border-border bg-background/60 py-4 text-center text-xs font-bold uppercase tracking-wider text-primary">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </div>
          <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-4 text-xs transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-10 text-xs transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-2.5 text-muted-foreground transition-colors hover:text-primary"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/50 bg-destructive/15 p-3 text-center text-xs font-medium text-destructive">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="neon-glow w-full rounded-xl bg-primary py-3 text-xs font-extrabold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <button
              type="button"
              onClick={googleSignIn}
              className="w-full rounded-xl border border-border bg-secondary py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-accent"
            >
              Continue with Google
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signin" ? "New here? " : "Already have an account? "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                }}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
