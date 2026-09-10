"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Topbar({ onMenuClick }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const adminName = user?.name || "Admin";
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 md:pl-72 md:pr-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted md:hidden"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            ☰
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
              <Image
                src={`/img/general/logo.png${process.env.NEXT_PUBLIC_LOGO_VERSION ? `?v=${process.env.NEXT_PUBLIC_LOGO_VERSION}` : ""}`}
                alt="Royal Vision"
                fill
                sizes="32px"
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold text-foreground">{adminName}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            aria-label="Sign out"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

