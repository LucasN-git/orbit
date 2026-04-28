"use client";

import { useTransition } from "react";
import { UserIcon } from "@/components/icons";
import { logoutAction } from "./actions";

export function LogoutBtn() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => logoutAction())}
      disabled={pending}
      className="t-label-m text-error w-full py-4 inline-flex items-center justify-center gap-2"
    >
      <UserIcon size={18} />
      {pending ? "Wird ausgeloggt …" : "Abmelden"}
    </button>
  );
}
