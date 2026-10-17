"use client";

import { useState } from "react";
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
      <form onSubmit={(event) => event.preventDefault()}>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <div className="input-wrap">
          <Mail aria-hidden="true" />
          <input id="email" type="email" autoComplete="email" />
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
        <button className="login-button" type="submit">
          Log in
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
