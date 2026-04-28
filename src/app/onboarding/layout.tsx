import { ReactNode } from "react";
import { PhoneFrame } from "@/components/shell/PhoneFrame";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
