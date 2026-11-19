"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { authClient } from "../../../lib/auth-client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function SignUpPage() {
    const submitting = useRef(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submitting.current) return;

        setError("");

        const formData = new FormData(event.currentTarget);

        const name = String(formData.get("name") ?? "").trim();
        const email = String(formData.get("email") ?? "").trim();
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");
        const role = String(formData.get("role") ?? "");

        if (name.length < 2 || name.length > 80) {
            setError("Name must contain 2–80 characters.");
            return;
        }

        if (
            password.length < 6 ||
            password.length > 128 ||
            !/[a-z]/.test(password) ||
            !/[A-Z]/.test(password)
        ) {
            setError(
                "Use 6–128 characters, including an uppercase and a lowercase letter."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (role !== "customer" && role !== "vendor") {
            setError("Choose Customer or Vendor.");
            return;
        }

        submitting.current = true;
        setIsSubmitting(true);

        try {
            const result = await authClient.signUp.email({
                name,
                email,
                password,
                role,
            });

            if (result.error) {
                setError(result.error.message || "Unable to create your account.");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Unable to reach the server. Please try again.");
        } finally {
            submitting.current = false;
            setIsSubmitting(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100";

    if (success) {
        return (
            <main className="bg-orange-50/50 px-4 py-20">
                <section className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
                    <div role="status" aria-live="polite">
                        <h1 className="text-2xl font-bold text-stone-900">
                            Welcome to PizzaHub!
                        </h1>

                        <p className="mt-3 text-stone-600">
                            Your account has been created and you are signed in.
                        </p>
                    </div>

                    <Link
                        href="/menu"
                        className="mt-6 inline-flex rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
                    >
                        Browse Menu
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="bg-orange-50/50 px-4 py-12 sm:py-16">
            <section className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                    Join PizzaHub
                </p>

                <h1 className="mt-3 text-3xl font-bold text-stone-900">
                    Create your account
                </h1>

                <p className="mt-3 text-stone-600">
                    Order your favourites or share your menu with hungry customers.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8"
                    aria-busy={isSubmitting}
                >
                    <fieldset disabled={isSubmitting} className="space-y-5">
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
                                autoComplete="name"
                                placeholder="Your full name"
                                minLength={2}
                                maxLength={80}
                                required
                                className={inputClass}
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
                                htmlFor="role"
                                className="text-sm font-medium text-stone-800"
                            >
                                Account type
                            </label>

                            <select
                                id="role"
                                name="role"
                                defaultValue="customer"
                                className={inputClass}
                            >
                                <option value="customer">Customer — order food</option>
                                <option value="vendor">Vendor — sell food</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-stone-800"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    minLength={6}
                                    maxLength={128}
                                    aria-describedby="password-help"
                                    required
                                    className={`${inputClass} pr-20`}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                                    aria-pressed={showPassword}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 pt-2 text-sm font-semibold text-red-700"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            <p
                                id="password-help"
                                className="mt-2 text-xs text-stone-500"
                            >
                                Use at least 6 characters, including uppercase and lowercase
                                letters.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="text-sm font-medium text-stone-800"
                            >
                                Confirm password
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                minLength={6}
                                maxLength={128}
                                required
                                className={inputClass}
                            />
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
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting && (
                                <span
                                    aria-hidden="true"
                                    className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
                                />
                            )}

                            <span aria-live="polite">
                                {isSubmitting ? "Creating account..." : "Create Account"}
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
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-red-700 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </section>
        </main>
    );
}