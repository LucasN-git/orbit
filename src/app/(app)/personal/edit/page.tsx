import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { ChevronRightIcon } from "@/components/icons";
import { getMe } from "@/lib/data";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const { user } = await getMe();

  return (
    <>
      <TopBar
        title="Profil bearbeiten"
        showBell={false}
        leading={
          <Link
            href="/personal"
            aria-label="Zurück"
            className="t-label-m text-postage flex items-center gap-1 -ml-1 px-1"
          >
            <ChevronRightIcon size={18} className="rotate-180" />
            Zurück
          </Link>
        }
      />

      <div className="px-4 pb-28 pt-2">
        <EditProfileForm
          defaults={{
            first_name: user.first_name ?? null,
            last_name: user.last_name ?? null,
            email: user.email ?? null,
            username: user.username ?? null,
            phone: user.phone ?? null,
          }}
        />
      </div>
    </>
  );
}
