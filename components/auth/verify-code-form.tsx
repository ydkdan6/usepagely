"use client";

type VerifyCodeFormProps = {
  onVerified: () => void;
};

export function VerifyCodeForm({ onVerified }: VerifyCodeFormProps) {
  return (
    <div className="form-content recovery-step-content">
      <h1 id="auth-title">Verify your code</h1>
      <p className="subheading">
        Please enter the code sent to your email or phone.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onVerified();
        }}
      >
        <label className="field-label" htmlFor="verification-code">
          Code
        </label>
        <div className="input-wrap">
          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Verification code"
          />
        </div>
        <button className="login-button" type="submit">
          Verify
        </button>
      </form>
      <button className="text-action" type="button">
        Resend code
      </button>
    </div>
  );
}
