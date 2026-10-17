"use client";

import { useState } from "react";
import { ArtworkPanel } from "@/components/auth/artwork-panel";
import { BrandHeader } from "@/components/auth/brand-header";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

export function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <main className="login-page">
      <BrandHeader />
      <section className="login-layout" aria-labelledby="auth-title">
        <ArtworkPanel />
        <div className="form-panel">
          {isSignup ? (
            <SignupForm />
          ) : (
            <LoginForm onCreateAccount={() => setIsSignup(true)} />
          )}
        </div>
      </section>
    </main>
  );
}
