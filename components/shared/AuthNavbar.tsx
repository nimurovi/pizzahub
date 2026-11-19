"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import Navbar from "./Navbar";
import { toast } from "sonner";

type Role = "customer" | "vendor" | "admin";

function isRole(value: unknown): value is Role {
  return (
    value === "customer" ||
    value === "vendor" ||
    value === "admin"
  );
}

export default function AuthNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  // Refresh after navigation, including after Google role selection.
  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  const sessionUser = session?.user;
  const role = sessionUser?.role;

  const invalidRole = Boolean(sessionUser) && !isRole(role);

  const user =
    sessionUser && isRole(role)
      ? {
          name: sessionUser.name,
          email: sessionUser.email,
          image: sessionUser.image ?? null,
          role,
        }
      : null;

  async function handleLogout() {
  const toastId = toast.loading("Logging out...");

  try {
    const result = await authClient.signOut();

    if (result.error) {
      throw new Error(
        result.error.message || "Unable to log out. Please try again."
      );
    }

    toast.success("Logged out successfully.", {
      id: toastId,
    });

    router.replace("/");
    router.refresh();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to log out. Please try again.";

    toast.error(message, {
      id: toastId,
    });

    // Preserve the existing inline error handling in Navbar.
    throw new Error(message);
  }
}

  return (
    <>
      <Navbar
        user={user}
        isPending={isPending || Boolean(error) || invalidRole}
        onLogout={handleLogout}
      />

      {(error || invalidRole) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-3 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>
            {invalidRole
              ? "Unable to load your account role."
              : "Unable to check your sign-in status."}
          </span>

          <button
            type="button"
            onClick={() => void refetch()}
            className="font-semibold underline underline-offset-4"
          >
            Try Again
          </button>
        </div>
      )}
    </>
  );
}