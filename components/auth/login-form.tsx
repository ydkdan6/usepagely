"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { toast } from "sonner";

type LoginFormProps = {
  onCreateAccount: () => void;
  onForgotPassword: () => void;
};

export function LoginForm({
  onCreateAccount,
  onForgotPassword,
}: LoginFormProps) {
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="form-content">
      <h1 id="auth-title">Welcome back</h1>
      <p className="subheading">Log in to continue your reading journey.</p>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <form
        aria-busy={loading}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const form = new FormData(event.currentTarget);
          try {
            const result = await Promise.race([
              signIn({
                email: form.get("email"),
                password: form.get("password"),
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("timeout")), 15000),
              ),
            ]);
            if (result.error) throw result.error;
            const returnTo =
              new URLSearchParams(window.location.search).get("returnTo") ||
              "/";
            toast.success("Welcome back.");
            router.refresh();
            router.replace(returnTo.startsWith("/") ? returnTo : "/");
          } catch (caught) {
            const message =
              caught instanceof Error && caught.message === "timeout"
                ? "The login took too long. Please try again."
                : caught instanceof Error &&
                    caught.message.includes("Email not confirmed")
                  ? "Please confirm your email first."
                  : "Invalid email or password.";
            toast.error(message);
            setError(message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <div className="input-wrap">
          <Mail aria-hidden="true" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
        />
        <div className="form-options">
          <label className="remember-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Stay signed in</span>
          </label>
          {/* <a
            href="/forgot-password"
            onClick={(event) => {
              event.preventDefault();
              router.push("/forgot-password");
            }}
          >
            Forgot password?
          </a> */}
        </div>
        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="signup-prompt">
        Need an account?{" "}
        <a
          href="#create"
          onClick={(event) => {
            event.preventDefault();
            router.push("/signup");
          }}
        >
          Create one
        </a>
      </p>
    </div>
  );
}
