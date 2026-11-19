"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "customer" | "vendor" | "admin";

type NavbarUser = {
    name: string;
    email: string;
    image?: string | null;
    role: Role;
};

type NavbarProps = {
    user?: NavbarUser | null;
    isPending?: boolean;
    onLogout?: () => Promise<void>;
};

const roleLinks: Record<Role, { label: string; href: string }> = {
    customer: {
        label: "My Orders",
        href: "/dashboard/customer/orders",
    },
    vendor: {
        label: "My Menu",
        href: "/dashboard/vendor/menu",
    },
    admin: {
        label: "Manage Users",
        href: "/dashboard/admin/users",
    },
};

const focusStyles =
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-orange-600 focus-visible:ring-offset-4";

export default function Navbar({
    user = null,
    isPending = false,
    onLogout,
}: NavbarProps) {
    const pathname = usePathname();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

    const profileRef = useRef<HTMLDetailsElement>(null);
    const mobileButtonRef = useRef<HTMLButtonElement>(null);

    const links = [
        { label: "Home", href: "/" },
        { label: "Browse Menu", href: "/menu" },
        ...(!isPending && user ? [roleLinks[user.role]] : []),
    ];

    function closeMenus() {
        setMobileOpen(false);

        if (profileRef.current) {
            profileRef.current.open = false;
        }
    }

    function isActive(href: string) {
        return href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
    }

    async function handleLogout() {
        if (!onLogout || loggingOut) return;

        setLoggingOut(true);
        setLogoutError("");

        try {
            await onLogout();
            closeMenus();
        } catch {
            setLogoutError("Could not sign out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <header
            className="sticky top-0 z-50 border-b border-orange-100 bg-[#fffaf3] text-stone-800"
            onKeyDown={(event) => {
                if (event.key !== "Escape") return;

                if (profileRef.current?.open) {
                    profileRef.current.open = false;
                    profileRef.current
                        .querySelector<HTMLElement>("summary")
                        ?.focus();
                } else if (mobileOpen) {
                    setMobileOpen(false);
                    mobileButtonRef.current?.focus();
                }
            }}
        >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-10 px-5 py-4 lg:flex-nowrap lg:px-8">
                {/* Logo */}
                <Link
                    href="/"
                    aria-label="PizzaHub home"
                    onClick={closeMenus}
                    className={`shrink-0 rounded-lg ${focusStyles}`}
                >
                    <Image
                        src="/images/pizzahub-logo.png"
                        alt="PizzaHub"
                        width={210}
                        height={70}
                        priority
                        className="h-auto w-40 lg:w-44"
                    />
                </Link>

                {/* Mobile navigation toggle */}
                <button
                    ref={mobileButtonRef}
                    type="button"
                    aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={mobileOpen}
                    aria-controls="main-navigation"
                    onClick={() => setMobileOpen((previous) => !previous)}
                    className={`flex size-11 items-center justify-center rounded-xl border border-orange-200 bg-white lg:hidden ${focusStyles}`}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        {mobileOpen ? (
                            <path d="M6 6l12 12M6 18L18 6" />
                        ) : (
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                <nav
                    id="main-navigation"
                    aria-label="Main navigation"
                    className={`${mobileOpen ? "flex" : "hidden"
                        } mt-4 w-full flex-col gap-4 border-t border-orange-100 pt-4 lg:mt-0 lg:flex lg:w-auto lg:flex-1 lg:flex-row lg:items-center lg:justify-between lg:border-0 lg:pt-0`}
                >
                    {/* Navigation links */}
                    <div className="flex flex-col gap-1 lg:flex-row lg:items-center">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMenus}
                                aria-current={isActive(link.href) ? "page" : undefined}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors motion-reduce:transition-none ${focusStyles} ${isActive(link.href)
                                        ? "bg-orange-100 text-red-800"
                                        : "text-stone-600 hover:bg-orange-50 hover:text-red-800"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Account actions */}
                    <div className="flex items-center gap-3 border-t border-orange-100 pt-4 lg:border-0 lg:pt-0">
                        {isPending ? (
                            <span
                                role="status"
                                className="inline-flex items-center gap-2 text-sm text-stone-600"
                            >
                                <span
                                    aria-hidden="true"
                                    className="size-5 animate-spin rounded-full border-2 border-stone-200 border-t-red-700 motion-reduce:animate-none"
                                />

                                <span className="sr-only">Loading account...</span>
                            </span>
                        ) : user ? (
                            <details
                                ref={profileRef}
                                className="relative w-full lg:w-auto"
                                onBlur={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget)) {
                                        event.currentTarget.open = false;
                                    }
                                }}
                            >
                                <summary
                                    className={`flex w-fit max-w-full cursor-pointer list-none items-center gap-3 rounded-full border border-orange-200 bg-white p-1.5 pr-4 [&::-webkit-details-marker]:hidden ${focusStyles}`}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 font-bold text-red-800">
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt=""
                                                width={40}
                                                height={40}
                                                unoptimized
                                                className="size-10 object-cover"
                                            />
                                        ) : (
                                            (user.name || "U").charAt(0).toUpperCase()
                                        )}
                                    </span>

                                    <span className="max-w-32 truncate text-sm font-semibold">
                                        {user.name || "My Account"}
                                    </span>

                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        aria-hidden="true"
                                    >
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </summary>

                                <div className="mt-3 w-full rounded-2xl border border-orange-100 bg-white p-2 shadow-lg lg:absolute lg:right-0 lg:w-64">
                                    <div className="mb-2 border-b border-orange-100 px-3 py-3">
                                        <p className="break-words text-sm font-semibold">
                                            {user.name}
                                        </p>
                                        <p className="mt-1 break-all text-xs text-stone-500">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/dashboard/${user.role}`}
                                        onClick={closeMenus}
                                        className={`block rounded-lg px-3 py-3 text-sm hover:bg-orange-50 ${focusStyles}`}
                                    >
                                        Dashboard
                                    </Link>

                                    <Link
                                        href="/profile"
                                        onClick={closeMenus}
                                        className={`block rounded-lg px-3 py-3 text-sm hover:bg-orange-50 ${focusStyles}`}
                                    >
                                        Profile Settings
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        disabled={loggingOut || !onLogout}
                                        className={`w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusStyles}`}
                                    >
                                        {loggingOut ? "Signing out…" : "Logout"}
                                    </button>

                                    {logoutError && (
                                        <p
                                            role="alert"
                                            className="px-3 py-2 text-xs text-red-700"
                                        >
                                            {logoutError}
                                        </p>
                                    )}
                                </div>
                            </details>
                        ) : (
                            <>
                                <Link
                                    href="/sign-in"
                                    onClick={closeMenus}
                                    className={`flex-1 rounded-xl px-5 py-3 text-center text-sm font-semibold text-stone-700 hover:bg-orange-100 lg:flex-none ${focusStyles}`}
                                >
                                    Sign In
                                </Link>

                                <Link
                                    href="/sign-up"
                                    onClick={closeMenus}
                                    className={`flex flex-1 items-center justify-center gap-3 rounded-xl bg-red-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-800 motion-reduce:transition-none lg:flex-none ${focusStyles}`}
                                >
                                    Sign Up
                                    <span aria-hidden="true">↗</span>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}