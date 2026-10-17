"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
};

export function PasswordField({ id, label, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrap">
        <LockKeyhole aria-hidden="true" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}
