"use client";

import { useState } from "react";
import { ArtworkPanel } from "@/components/auth/artwork-panel";
import { BrandHeader } from "@/components/auth/brand-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SignupForm } from "@/components/auth/signup-form";
import { VerifyCodeForm } from "@/components/auth/verify-code-form";
import { literata, montserrat } from "@/components/auth/fonts";

export function AuthScreen({
  initialScreen = "login",
}: {
  initialScreen?: "login" | "signup" | "forgot" | "verify" | "reset";
}) {
  const [screen, setScreen] = useState<
    "login" | "signup" | "forgot" | "verify" | "reset"
  >(initialScreen);

  return (
    <main className={`login-page ${literata.variable} ${montserrat.variable}`}>
      <section className="login-layout" aria-labelledby="auth-title">
        <ArtworkPanel />
        <div className="form-panel">
          <BrandHeader />
          {screen === "signup" ? (
            <SignupForm />
          ) : screen === "forgot" ? (
            <ForgotPasswordForm
              onBackToLogin={() => setScreen("login")}
              onCodeSent={() => setScreen("verify")}
            />
          ) : screen === "verify" ? (
            <VerifyCodeForm onVerified={() => setScreen("reset")} />
          ) : screen === "reset" ? (
            <ResetPasswordForm onComplete={() => setScreen("login")} />
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
