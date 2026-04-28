import { OrbitLogo } from "@/components/OrbitLogo";
import { TabSkeleton } from "./_components/TabSkeleton";

export default function Loading() {
  return (
    <TabSkeleton
      title="Current Orbit"
      leading={<OrbitLogo size={32} className="text-ink-primary -ml-1" />}
      rows={4}
    />
  );
}
