"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "../../../lib/auth-client";
 
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import RequireAuth from "@/components/auth/RequirAuth";

function ProfileAvatar({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "P";

  if (!image || imageFailed) {
    return (
      <div
        aria-label={`${name}'s profile`}
        className="flex size-24 shrink-0 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-700"
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={image}
      alt={`${name}'s profile`}
      width={96}
      height={96}
      unoptimized
      onError={() => setImageFailed(true)}
      className="size-24 shrink-0 rounded-full object-cover"
    />
  );
}

function ProfileSettings() {
  const { data: session, refetch } = authClient.useSession();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving.current) return;

    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (name.length < 2 || name.length > 80) {
      const message = "Name must contain 2–80 characters.";

      setError(message);
      toast.error(message, { id: "profile-validation" });
      return;
    }

    if (name === session?.user.name) {
      toast.info("Your profile is already up to date.");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      const message = "The API URL is not configured.";

      setError(message);
      toast.error(message);
      return;
    }

    saving.current = true;
    setIsSaving(true);

    const toastId = toast.loading("Saving your profile...");

    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Unable to update your profile."
        );
      }

      const nameInput = form.elements.namedItem("name");

      if (nameInput instanceof HTMLInputElement) {
        nameInput.value = name;
      }

      toast.success("Profile updated successfully.", {
        id: toastId,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === "TimeoutError"
          ? "The request timed out. Refresh to check whether your changes were saved."
          : error instanceof Error
            ? error.message
            : "Unable to update your profile. Please try again.";

      setError(message);
      toast.error(message, { id: toastId });

      saving.current = false;
      setIsSaving(false);
      return;
    }

    // Refresh the shared session so the navbar receives the new name.
    try {
      await refetch();
    } catch {
      toast.warning(
        "Your profile was saved. Reload the page to refresh your account details."
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  if (!session?.user) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  const user = session.user;

  return (
    <main className="bg-orange-50/50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
          Your account
        </p>

        <h1 className="mt-3 text-3xl font-bold text-stone-900">
          Profile Settings
        </h1>

        <p className="mt-3 text-stone-600">
          View your account details and update your name.
        </p>

        <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-4 border-b border-stone-100 pb-6 text-center sm:flex-row sm:text-left">
            <ProfileAvatar
              key={user.image || "no-image"}
              image={user.image}
              name={user.name}
            />

            <div className="min-w-0">
              <h2 className="break-words text-xl font-bold text-stone-900">
                {user.name}
              </h2>

              <p className="mt-1 break-words text-sm text-stone-600">
                {user.email}
              </p>

              <span className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold capitalize text-orange-800">
                {user.role}
              </span>
            </div>
          </div>

          <form
            key={user.id}
            onSubmit={handleSave}
            className="mt-6"
            aria-busy={isSaving}
          >
            <fieldset disabled={isSaving} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-stone-800"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "profile-error" : undefined}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-stone-800"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-600"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-stone-800"
                >
                  Account role
                </label>

                <input
                  id="role"
                  type="text"
                  value={user.role || ""}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 capitalize text-stone-600"
                />
              </div>

              <p className="text-sm text-stone-500">
                Your email and account role cannot be changed here.
              </p>

              {error && (
                <p
                  id="profile-error"
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving && (
                  <span
                    aria-hidden="true"
                    className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                  />
                )}

                <span aria-live="polite">
                  {isSaving ? "Saving..." : "Save Changes"}
                </span>
              </button>
            </fieldset>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileSettings />
    </RequireAuth>
  );
}