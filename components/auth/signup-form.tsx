"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth/actions";
import { Mail, Phone, UserRound, AtSign } from "lucide-react";
import { PasswordField } from "@/components/auth/password-field";
import { toast } from "sonner";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);

      const password = String(form.get("signup-password") ?? "");
      const confirmPassword = String(form.get("confirm-password") ?? "");

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { data, error: signUpError } = await signUp({
        email: String(form.get("signup-email") ?? "").trim(),
        password,
        name: String(form.get("full-name") ?? "").trim(),
        username: String(form.get("username") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(),
      });

      if (signUpError) {
        console.error("signUp failed:", signUpError.message);
        setError(signUpError.message);
        toast.error(signUpError.message);
        return;
      }

      // Email confirmation on: no session yet
      if (!data?.session) {
        toast.success("Check your email to confirm your account.");
        router.push("/login");
        return;
      }

      toast.success("Your account has been created.");
      router.push("/");
    } catch (err) {
      console.error("signup crashed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit}>
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            pattern="[A-Za-z0-9_]{3,20}"
            title="3-20 characters: letters, numbers, underscore"
            required
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

        <p className="signup-prompt">
          Already have an account?{" "}
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              router.push("/login");
            }}
          >
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
