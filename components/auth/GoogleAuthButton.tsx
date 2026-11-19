
"use client";

import { useRef, useState } from "react";
import { authClient } from "../../lib/auth-client";

type GoogleAuthButtonProps = {
  disabled?: boolean;
};

export default function GoogleAuthButton({
  disabled = false,
}: GoogleAuthButtonProps) {
  const busy = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleAuth() {
    if (busy.current || disabled) return;

    busy.current = true;
    setIsLoading(true);
    setError("");

    try {
      const origin = window.location.origin;

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${origin}/auth/complete`,
        newUserCallbackURL: `${origin}/auth/complete`,
        errorCallbackURL: `${origin}/auth/complete?failed=1`,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Google sign-in could not start."
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again."
      );

      busy.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && (
          <span
            aria-hidden="true"
            className="size-5 animate-spin rounded-full border-2 border-stone-200 border-t-red-700 motion-reduce:animate-none"
          />
        )}

        <span aria-live="polite">
          {isLoading ? "Connecting to Google..." : "Continue with Google"}
        </span>
      </button>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}