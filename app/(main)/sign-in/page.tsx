"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { authClient } from "../../../lib/auth-client";
import GoogleAuthButton from "../../../components/auth/GoogleAuthButton";
import { toast } from "sonner";

export default function SignInPage() {
    const router = useRouter();
    const submitting = useRef(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitting.current) return;

        setError("");

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        submitting.current = true;
        setIsSubmitting(true);

        try {
            const result = await authClient.signIn.email({
                email,
                password,
            });

            if (result.error) {
                throw new Error(
                    result.error.message || "Unable to sign in. Please try again."
                );
            }

            // This page checks the saved role and handles redirection.
            router.replace("/auth/complete");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Unable to reach the server. Please try again.";

            setError(message);

            toast.error(message, {
                id: "sign-in-error",
            });

            submitting.current = false;
            setIsSubmitting(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100";

    return (
        <main className="bg-orange-50/50 px-4 py-12 sm:py-16">
            <section className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                    Welcome back
                </p>

                <h1 className="mt-3 text-3xl font-bold text-stone-900">
                    Sign in to PizzaHub
                </h1>

                <p className="mt-3 text-stone-600">
                    Access your account and pick up where you left off.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8"
                    aria-busy={isSubmitting}
                >
                    <fieldset disabled={isSubmitting} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-stone-800"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-stone-800"
                            >
                                Password
                            </label>

                            <div className="relative mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-4 pr-20 text-stone-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-red-700"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting && (
                                <span
                                    aria-hidden="true"
                                    className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                                />
                            )}

                            <span aria-live="polite">
                                {isSubmitting ? "Signing in..." : "Sign In"}
                            </span>
                        </button>
                    </fieldset>
                </form>

                <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-stone-200" />
                    <span className="text-sm text-stone-500">or</span>
                    <div className="h-px flex-1 bg-stone-200" />
                </div>

                <GoogleAuthButton disabled={isSubmitting} />

                <p className="mt-6 text-center text-sm text-stone-600">
                    New to PizzaHub?{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-red-700 hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </section>
        </main>
    );
}