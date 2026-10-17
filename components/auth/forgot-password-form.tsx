"use client";

import { Mail } from "lucide-react";

type ForgotPasswordFormProps = { onBackToLogin: () => void };

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  return (
    <div className="form-content forgot-content">
      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h1 id="auth-title">Forgot Password</h1>
      <p className="subheading forgot-description">
        Enter the email address or phone number associated with your account to
        receive a password reset code.
      </p>
      <form onSubmit={(event) => event.preventDefault()}>
        <label className="field-label" htmlFor="recovery-contact">
          Email or Phone
        </label>
        <div className="input-wrap">
          <Mail aria-hidden="true" />
          <input id="recovery-contact" type="text" autoComplete="email" />
        </div>
        <button className="login-button" type="submit">
          Send code
        </button>
      </form>
      <p className="signup-prompt recovery-back">
        Remember your password?{" "}
        <a
          href="#login"
          onClick={(event) => {
            event.preventDefault();
            onBackToLogin();
          }}
        >
          Log in
        </a>
      </p>
    </div>
  );
}
