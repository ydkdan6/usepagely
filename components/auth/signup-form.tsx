"use client";

import { useRouter } from "next/navigation";
import { Mail, Phone, UserRound, AtSign } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";

export function SignupForm() {
  const router = useRouter();

  return (
    <div className="form-content">
      <div className="eyebrow">GET STARTED</div>
      <h1 id="auth-title">Registration</h1>
      <p className="subheading">Come on and create an account</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/library");
        }}
      >
        <label className="field-label" htmlFor="full-name">
          Full name
        </label>
        <div className="input-wrap">
          <UserRound aria-hidden="true" />
          <input id="full-name" type="text" autoComplete="name" />
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
          <input id="signup-email" type="email" autoComplete="email" />
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
        <button className="login-button" type="submit">
          Sign up
        </button>
      </form>
    </div>
  );
}
