import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { buildPrivateMetadata } from "@/lib/seo";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = buildPrivateMetadata(
  "Reset password",
  "Reset your Zenvexa password.",
);

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
