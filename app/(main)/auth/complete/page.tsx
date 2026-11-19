"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "../../../../components/shared/LoadingSpinner";

type Role = "customer" | "vendor" | "admin";

type Account = {
  name?: string;
  role: Role;
  roleSelectionPending: boolean;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: Account;
};

type PageState =
  | { status: "loading" }
  | { status: "choose"; name: string }
  | { status: "redirecting"; role: Role; message: string }
  | { status: "error"; message: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function isRole(value: unknown): value is Role {
  return (
    value === "customer" ||
    value === "vendor" ||
    value === "admin"
  );
}

async function requestOnboarding(
  path: string,
  options: RequestInit = {}
): Promise<Account> {
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is missing.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });

  const body: ApiResponse = await response.json();

  if (!response.ok || body.success !== true) {
    throw new Error(body.message || "Unable to complete this request.");
  }

  if (
    !body.data ||
    !isRole(body.data.role) ||
    typeof body.data.roleSelectionPending !== "boolean"
  ) {
    throw new Error("The server returned an invalid account response.");
  }

  return body.data;
}

function AuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const googleFailed =
    searchParams.has("failed") || searchParams.has("error");

  const [state, setState] = useState<PageState>({
    status: "loading",
  });

  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor">(
    "customer"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const saving = useRef(false);

  useEffect(() => {
    if (googleFailed) return;

    const controller = new AbortController();
    let active = true;

    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    async function loadAccount() {
      try {
        const account = await requestOnboarding("/api/onboarding", {
          signal: controller.signal,
        });

        if (!active) return;

        if (account.roleSelectionPending) {
          setState({
            status: "choose",
            name: account.name || "there",
          });
        } else {
          setState({
            status: "redirecting",
            role: account.role,
            message: "Signed in successfully. Taking you to PizzaHub...",
          });
        }
      } catch (error) {
        if (!active) return;

        setState({
          status: "error",
          message: controller.signal.aborted
            ? "The request timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Unable to load your account.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadAccount();

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [googleFailed, attempt]);

  useEffect(() => {
    if (state.status !== "redirecting") return;

    const destinations: Record<Role, string> = {
      customer: "/menu",
      vendor: "/dashboard/vendor",
      admin: "/",
    };

    const timeout = window.setTimeout(() => {
      router.replace(destinations[state.role]);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [state, router]);

  function retry() {
    setState({ status: "loading" });
    setFormError("");
    setAttempt((previous) => previous + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving.current) return;

    saving.current = true;
    setIsSaving(true);
    setFormError("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const account = await requestOnboarding("/api/onboarding/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
        signal: controller.signal,
      });

      if (account.roleSelectionPending) {
        throw new Error("Your role was not saved. Please try again.");
      }

      setState({
        status: "redirecting",
        role: account.role,
        message: "Your account role has been saved. Redirecting...",
      });
    } catch (error) {
      setFormError(
        controller.signal.aborted
          ? "The request timed out. Check account status before trying again."
          : error instanceof Error
            ? error.message
            : "Unable to save your role."
      );
    } finally {
      window.clearTimeout(timeout);
      saving.current = false;
      setIsSaving(false);
    }
  }

  if (googleFailed) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Google sign-in was not completed
        </h1>

        <p role="alert" className="mt-3 text-stone-600">
          Please return to Sign Up and try again.
        </p>

        <Link
          href="/sign-up"
          className="mt-6 inline-block font-semibold text-red-700"
        >
          Back to Sign Up
        </Link>
      </div>
    );
  }

  if (state.status === "loading") {
    return <LoadingSpinner message="Checking your account..." />;
  }

  if (state.status === "redirecting") {
    return <LoadingSpinner message={state.message} />;
  }

  if (state.status === "error") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Unable to continue
        </h1>

        <p role="alert" className="mt-3 text-red-700">
          {state.message}
        </p>

        <button
          type="button"
          onClick={retry}
          className="mt-6 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
        >
          Try Again
        </button>

        <Link
          href="/sign-up"
          className="mt-4 block text-sm font-semibold text-red-700"
        >
          Back to Sign Up
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
        Almost ready
      </p>

      <h1 className="mt-3 text-3xl font-bold text-stone-900">
        Welcome, {state.name}!
      </h1>

      <p className="mt-3 text-stone-600">
        Choose how you want to use PizzaHub. This choice can only be made
        once.
      </p>

      <form onSubmit={handleSubmit} className="mt-8" aria-busy={isSaving}>
        <fieldset disabled={isSaving} className="space-y-4">
          <legend className="mb-3 font-semibold text-stone-800">
            Account role
          </legend>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4 has-checked:border-red-700 has-checked:bg-red-50">
            <input
              type="radio"
              name="role"
              value="customer"
              checked={selectedRole === "customer"}
              onChange={() => setSelectedRole("customer")}
              className="mt-1 accent-red-700"
            />

            <span>
              <span className="block font-semibold text-stone-900">
                Customer
              </span>
              <span className="mt-1 block text-sm text-stone-600">
                Browse menus and order your favourite food.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4 has-checked:border-red-700 has-checked:bg-red-50">
            <input
              type="radio"
              name="role"
              value="vendor"
              checked={selectedRole === "vendor"}
              onChange={() => setSelectedRole("vendor")}
              className="mt-1 accent-red-700"
            />

            <span>
              <span className="block font-semibold text-stone-900">
                Vendor — Restaurant Owner
              </span>
              <span className="mt-1 block text-sm text-stone-600">
                Publish your menu and manage customer orders.
              </span>
            </span>
          </label>

          {formError && (
            <div className="rounded-xl bg-red-50 p-4">
              <p role="alert" className="text-sm text-red-700">
                {formError}
              </p>

              <button
                type="button"
                onClick={retry}
                className="mt-2 text-sm font-semibold text-red-700 underline"
              >
                Check account status
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && (
              <span
                aria-hidden="true"
                className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
              />
            )}

            <span aria-live="polite">
              {isSaving ? "Saving your role..." : "Save and Continue"}
            </span>
          </button>
        </fieldset>
      </form>
    </>
  );
}

export default function AuthCompletePage() {
  return (
    <main className="bg-orange-50/50 px-4 py-16">
      <section className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        <Suspense
          fallback={<LoadingSpinner message="Completing sign-in..." />}
        >
          <AuthCompleteContent />
        </Suspense>
      </section>
    </main>
  );
}