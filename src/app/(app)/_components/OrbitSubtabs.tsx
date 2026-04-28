"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/icons";
import type { FriendInOrbit, Mutual } from "@/lib/data";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrbitIcon } from "@/components/icons";

type Props = {
  friends: FriendInOrbit[];
  mutuals: Mutual[];
  mutualUnlock?: { missing: number; threshold: number } | null;
};

export function OrbitSubtabs({ friends, mutuals, mutualUnlock }: Props) {
  const [tab, setTab] = useState<"friends" | "mutuals">("friends");
  const list = tab === "friends" ? friends : mutuals;
  const isLocked = tab === "mutuals" && !!mutualUnlock;

  return (
    <>
      <div className="inline-flex p-1 rounded-full bg-sunken hairline">
        <SubTab
          active={tab === "friends"}
          onClick={() => setTab("friends")}
        >
          Freunde · {friends.length}
        </SubTab>
        <SubTab
          active={tab === "mutuals"}
          onClick={() => setTab("mutuals")}
        >
          Mutuals · {mutualUnlock ? "🔒" : mutuals.length}
        </SubTab>
      </div>

      {isLocked ? (
        <EmptyState
          icon={<OrbitIcon size={32} />}
          title="Mutuals starten bald."
          body={`Du brauchst noch ${mutualUnlock!.missing} Kontakte auf Orbit, damit Freunde von Freunden auftauchen.`}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<OrbitIcon size={32} />}
          title={
            tab === "friends" ? "Niemand im Orbit." : "Keine Mutuals hier."
          }
          body={
            tab === "friends"
              ? "Sobald Freunde in deiner Stadt sind, tauchen sie hier auf."
              : "Niemand in deiner Stadt aus dem zweiten Kreis."
          }
        />
      ) : (
        <ul className="space-y-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/profile/${p.id}`}
                className="block active:scale-[0.99] transition-transform"
              >
                <Card className="flex items-center gap-3">
                  <Avatar name={p.name} tone={p.tone} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="t-label-l text-ink-primary truncate">
                      {p.name}
                    </div>
                    {tab === "friends" ? (
                      <div className="t-mono text-ink-secondary mt-0.5">
                        {p.city} · seit {(p as FriendInOrbit).since}
                      </div>
                    ) : (
                      <div className="t-body-s text-ink-secondary mt-0.5">
                        {(p as Mutual).mutuals} gemeinsame Freunde
                      </div>
                    )}
                  </div>
                  <ChevronRightIcon
                    size={20}
                    className="text-ink-tertiary shrink-0"
                  />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`t-label-m h-9 px-4 rounded-full transition-colors ${
        active
          ? "bg-canvas text-ink-primary shadow-[var(--shadow-card)]"
          : "text-ink-secondary"
      }`}
    >
      {children}
    </button>
  );
}
