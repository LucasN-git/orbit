import { ReactNode } from "react";
import { PhoneFrame } from "@/components/shell/PhoneFrame";
import { TabBar } from "@/components/shell/TabBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame>
      <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      <TabBar />
    </PhoneFrame>
  );
}
