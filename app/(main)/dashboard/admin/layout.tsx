import RequireAuth from "@/components/auth/RequirAuth";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireAuth role="admin">{children}</RequireAuth>;
}
