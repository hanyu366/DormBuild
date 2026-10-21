"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "首页", href: "/dashboard", icon: "🏠" },
  { label: "值扫", href: "/duty", icon: "🧹" },
  { label: "缴费", href: "/payment", icon: "💰" },
  { label: "洗晒", href: "/laundry", icon: "☀️" },
  { label: "我的", href: "/profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-warm-parchment border-t border-sage-border z-30">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 text-center py-3 text-sm font-semibold transition-colors ${
                active
                  ? "text-posthog-orange"
                  : "text-olive-ink hover:text-posthog-orange"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="block text-xs mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
