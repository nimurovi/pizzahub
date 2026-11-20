"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "../../lib/auth-client";
import LoadingSpinner from "../shared/LoadingSpinner";

type Role = "customer" | "vendor" | "admin";

type RequireAuthProps = {
  children: ReactNode;
  role?: Role;
};

export default function RequireAuth({
  children,
  role,
}: RequireAuthProps) {
  const router = useRouter();

  const {
    data: session,
    isPending,
    error,
    refetch,
  } = authClient.useSession();

  const user = session?.user;

  const validRole =
    user?.role === "customer" ||
    user?.role === "vendor" ||
    user?.role === "admin";

  const blocked = user?.isBlocked === true;
  const needsRole = user?.roleSelectionPending === true;

  const wrongRole = Boolean(
    user && validRole && role && user.role !== role
  );

  useEffect(() => {
    if (isPending) return;

    if (error) {
      toast.error("Unable to check your account. Please try again.", {
        id: "dashboard-auth-error",
      });
      return;
    }

    if (!user) {
      toast.error("Please sign in to access this page.", {
        id: "dashboard-auth-error",
      });

      router.replace("/sign-in");
      return;
    }

    if (blocked) {
      toast.error("Your account is blocked.", {
        id: "dashboard-auth-error",
      });
      return;
    }

    if (needsRole) {
      router.replace("/auth/complete");
      return;
    }

    if (!validRole) {
      toast.error("Your account role could not be verified.", {
        id: "dashboard-auth-error",
      });
      return;
    }

    if (wrongRole) {
      toast.error("You do not have access to this dashboard.", {
        id: "dashboard-auth-error",
      });

      router.replace("/auth/complete");
    }
  }, [
    isPending,
    error,
    user,
    blocked,
    needsRole,
    validRole,
    wrongRole,
    router,
  ]);

  if (isPending) {
    return <LoadingSpinner message="Checking your account..." />;
  }

  if (error) {
    return (
      <div className="px-4 py-16 text-center">
        <p role="alert" className="text-stone-700">
          Unable to verify your session.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-5 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Account unavailable
        </h1>

        <p role="alert" className="mt-3 text-stone-600">
          Your account is blocked. Please contact PizzaHub support.
        </p>
      </div>
    );
  }

  if (user && !validRole && !needsRole) {
    return (
      <div className="px-4 py-16 text-center">
        <p role="alert" className="text-stone-700">
          Your account role could not be verified.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-5 rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user || needsRole || wrongRole) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  return <>{children}</>;
}