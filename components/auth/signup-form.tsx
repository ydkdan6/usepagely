"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth/actions";
import { Mail, Phone, UserRound, AtSign } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="form-content">
      <div className="eyebrow">GET STARTED</div>
      <h1 id="auth-title">Registration</h1>
      <p className="subheading">Come on and create an account</p>
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

          const formEl = event.currentTarget;
          const form = new FormData(formEl);

          // Read passwords directly from the inputs by id
          const getValue = (id: string) =>
            (formEl.elements.namedItem(id) as HTMLInputElement | null)?.value ??
            "";

          const password = getValue("signup-password");
          const confirmPassword = getValue("confirm-password");

          if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            setLoading(false);
            return;
          }

          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }

          const { error } = await signUp({
            email: String(form.get("signup-email") ?? ""),
            password,
            name: String(form.get("full-name") ?? ""),
          });

          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }

          router.push("/library");
          router.refresh();
        }}
      >
        <label className="field-label" htmlFor="full-name">
          Full name
        </label>
        <div className="input-wrap">
          <UserRound aria-hidden="true" />
          <input
            id="full-name"
            name="full-name"
            type="text"
            autoComplete="name"
            required
          />
        </div>

        <label className="field-label" htmlFor="username">
          Username
        </label>
        <div className="input-wrap">
          <AtSign aria-hidden="true" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
          />
        </div>

        <label className="field-label" htmlFor="signup-email">
          Email
        </label>
        <div className="input-wrap">
          <Mail aria-hidden="true" />
          <input
            id="signup-email"
            name="signup-email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <label className="field-label" htmlFor="phone">
          Phone
        </label>
        <div className="input-wrap">
          <Phone aria-hidden="true" />
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>

        <PasswordField
          id="signup-password"
          label="Password"
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          autoComplete="new-password"
        />

        <button className="login-button" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
