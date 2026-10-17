"use client";

import { PasswordField } from "@/components/auth/password-field";

type ResetPasswordFormProps = {
  onComplete: () => void;
};

export function ResetPasswordForm({ onComplete }: ResetPasswordFormProps) {
  return (
    <div className="form-content recovery-step-content">
      <h1 id="auth-title">Create a new password</h1>
      <p className="subheading">
        Create a new password to secure your account.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onComplete();
        }}
      >
        <PasswordField
          id="new-password"
          label="New Password"
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-new-password"
          label="Confirm Password"
          autoComplete="new-password"
        />
        <button className="login-button" type="submit">
          Create password
        </button>
      </form>
    </div>
  );
}
