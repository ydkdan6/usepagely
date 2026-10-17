"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth/actions";
import { useRouter } from "next/navigation";
import { Apple, LockKeyhole, Mail } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";

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
      <div className="eyebrow">WELCOME BACK</div>
      <h1 id="auth-title">Log in</h1>
      <p className="subheading">Continue your reading journey.</p>
      <div className="social-actions">
        <button className="social-button" type="button">
          <span className="google-g" aria-hidden="true">
            G
          </span>
          Log in using Google
        </button>
        <button className="social-button" type="button">
          <Apple aria-hidden="true" />
          Log in using Apple
        </button>
      </div>
      <div className="divider">
        <span />
        <em>Or</em>
        <span />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const form = new FormData(event.currentTarget);
          const { error } = await signIn({
            email: form.get("email"),
            password: form.get("password"),
          });
          if (error) {
            setError(
              error.message.includes("Email not confirmed")
                ? "Please confirm your email first."
                : "Invalid email or password.",
            );
            setLoading(false);
            return;
          }
          router.push("/library");
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
          <a
            href="#forgot"
            onClick={(event) => {
              event.preventDefault();
              onForgotPassword();
            }}
          >
            Forgot password?
          </a>
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
            onCreateAccount();
          }}
        >
          Create one
        </a>
      </p>
    </div>
  );
}
