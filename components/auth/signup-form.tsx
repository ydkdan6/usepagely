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
          const form = new FormData(event.currentTarget);
          if (form.get("password") !== form.get("confirm-password")) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
          }
          const { data, error } = await signUp({
            email: form.get("signup-email"),
            password: form.get("password"),
            name: form.get("full-name"),
          });
          if (error) {
            setError(error.message);
            setLoading(false);
            return;
          }
          if (data.session) router.push("/library");
          else router.push("/library");
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
          <input id="username" type="text" autoComplete="username" />
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
          <input id="phone" type="tel" autoComplete="tel" />
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
