"use client";

import { useState } from "react";
import { ArtworkPanel } from "@/components/auth/artwork-panel";
import { BrandHeader } from "@/components/auth/brand-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthScreen() {
  const [screen, setScreen] = useState<"login" | "signup" | "forgot">("login");

  return (
    <main className="login-page">
      <BrandHeader />
      <section className="login-layout" aria-labelledby="auth-title">
        <ArtworkPanel />
        <div className="form-panel">
          {screen === "signup" ? (
            <SignupForm />
          ) : screen === "forgot" ? (
            <ForgotPasswordForm onBackToLogin={() => setScreen("login")} />
          ) : (
            <LoginForm
              onCreateAccount={() => setScreen("signup")}
              onForgotPassword={() => setScreen("forgot")}
            />
          )}
        </div>
      </section>
    </main>
  );
}
