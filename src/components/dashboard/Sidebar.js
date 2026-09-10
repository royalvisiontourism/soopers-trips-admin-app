"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-config";

function isActive(pathname, href, allHrefs) {
  if (href === "/dashboard") return pathname === "/dashboard";
  const matches = pathname === href || pathname.startsWith(`${href}/`);
  if (!matches) return false;
  // If another nav item has a longer href that also matches, this one is not active (only the most specific matches).
  const moreSpecificMatches = allHrefs.some(
    (other) => other !== href && other.length > href.length && (pathname === other || pathname.startsWith(`${other}/`))
  );
  return !moreSpecificMatches;
}

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  const support = {
    emails: ["info@royalvisiondubai.com", "contact@royalvisiondubai.com"],
    phones: ["+971525049000", "+971552446915"],
    address: "Al Khaleej Center - Office No 414 4th Floor - Bur Dubai - Dubai",
    socials: [
      {
        label: "Instagram",
        href: "https://www.instagram.com/royalvisionfloatingrestaurant/",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.75 1.5a.75.75 0 1 1 0 1.5a.75.75 0 0 1 0-1.5ZM12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z"
            />
          </svg>
        ),
      },
      {
        label: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61587719113160",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.326 24h11.495v-9.294H9.691V11.01h3.13V8.309c0-3.1 1.893-4.788 4.659-4.788c1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0Z"
            />
          </svg>
        ),
      },
      {
        label: "YouTube",
        href: "https://www.youtube.com/@THEROYALVISIONFLOATINGRESTAURA",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.5.5A3 3 0 0 0 2.4 7.2 31.4 31.4 0 0 0 2 12a31.4 31.4 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 22 12a31.4 31.4 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
            />
          </svg>
        ),
      },
      {
        label: "TikTok",
        href: "https://www.tiktok.com/@theroyalvisionfloatingre?lang=en",
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 2h2a5.8 5.8 0 0 0 4 4v2a7.7 7.7 0 0 1-4-1.4V15a7 7 0 1 1-7-7h1v2h-1a5 5 0 1 0 5 5V2Z"
            />
          </svg>
        ),
      },
    ],
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`no-scrollbar fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto overscroll-contain border-r border-border bg-surface px-4 py-5 shadow-sm transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Sidebar"
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-muted">
              <Image
                src={`/img/general/logo.png${process.env.NEXT_PUBLIC_LOGO_VERSION ? `?v=${process.env.NEXT_PUBLIC_LOGO_VERSION}` : ""}`}
                alt="Royal Vision Floating Restaurant"
                fill
                className="object-contain p-1"
                priority
                unoptimized
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Royal Vision</div>
              <div className="text-xs text-[color:var(--color-light-1)]">Floating Restaurant</div>
            </div>
          </Link>

          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-foreground hover:bg-muted md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 px-2 text-xs font-medium tracking-wide text-[color:var(--color-light-1)]">
          NAVIGATION
        </div>

        <nav className="mt-3 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, NAV_ITEMS.map((i) => i.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Push tip box to the bottom so sidebar looks full-height */}
        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-border bg-primary-soft p-4 text-sm">
            <div className="font-semibold text-foreground">Support</div>
            <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
              Need help? Contact Royal Vision Floating Restaurant.
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-[color:var(--color-light-1)]">
                <span className="mt-0.5">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 9.5A2.5 2.5 0 1 0 12 6.5a2.5 2.5 0 0 0 0 5Z"
                    />
                  </svg>
                </span>
                <span>{support.address}</span>
              </div>

              {support.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p}`}
                  className="flex items-center gap-2 text-[color:var(--color-light-1)] hover:text-foreground"
                >
                  <span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1.1-.3c1.2.4 2.5.6 3.9.6c.6 0 1 .4 1 1V21c0 .6-.4 1-1 1C10.6 22 2 13.4 2 3c0-.6.4-1 1-1h4c.6 0 1 .4 1 1c0 1.4.2 2.7.6 3.9c.1.4 0 .8-.3 1.1l-2 2.8Z"
                      />
                    </svg>
                  </span>
                  <span>{p.replace("+971", "+971 ")}</span>
                </a>
              ))}

              {support.emails.map((e) => (
                <a
                  key={e}
                  href={`mailto:${e}`}
                  className="flex items-center gap-2 text-[color:var(--color-light-1)] hover:text-foreground"
                >
                  <span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"
                      />
                    </svg>
                  </span>
                  <span className="break-all">{e}</span>
                </a>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {support.socials.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-muted"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

