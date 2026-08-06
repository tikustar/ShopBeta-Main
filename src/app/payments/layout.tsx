import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivateMetadata(
  "Payments",
  "ShopBeta payment status pages.",
);

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
