import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { buildPrivateMetadata } from "@/lib/seo";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = buildPrivateMetadata(
  "Create account",
  "Create a Zenvexa account.",
);

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="py-16 text-center text-sm text-muted">Loading…</div>
        }
      >
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
