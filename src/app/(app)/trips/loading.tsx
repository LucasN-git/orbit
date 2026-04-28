import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { TabSkeleton } from "../_components/TabSkeleton";

export default function Loading() {
  return (
    <TabSkeleton
      title="Trips"
      rows={3}
      trailing={
        <Link
          href="/trip/new"
          aria-label="Trip planen"
          className="w-10 h-10 inline-flex items-center justify-center text-ink-primary"
        >
          <PlusIcon size={22} />
        </Link>
      }
    />
  );
}
