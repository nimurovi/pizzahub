import RequireAuth from "@/components/auth/RequirAuth";
import type { ReactNode } from "react";
 

export default function VendorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <RequireAuth role="vendor">{children}</RequireAuth>;
}