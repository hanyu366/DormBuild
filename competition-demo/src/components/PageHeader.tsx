"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function PageHeader({
  title,
  showBack = false,
  backHref = "/dashboard",
  rightContent,
}: {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: ReactNode;
}) {
  return (
    <header className="sticky top-0 bg-warm-parchment border-b border-sage-border px-4 py-3 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <Link href={backHref} className="text-olive-ink hover:text-posthog-orange transition-colors font-bold">
              ←
            </Link>
          )}
          <h1 className="text-lg font-bold text-deep-olive">{title}</h1>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
}
