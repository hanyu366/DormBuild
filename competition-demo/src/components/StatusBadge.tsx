"use client";

import type { ReactNode } from "react";

const variantStyles: Record<string, string> = {
  success: "bg-light-sage text-deep-olive",
  warning: "bg-warm-tan text-deep-olive",
  danger: "bg-[#fee2e2] text-posthog-orange",
  default: "bg-sage-cream text-olive-ink",
};

export default function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: string;
}) {
  return (
    <span className={`badge-pill ${variantStyles[variant] || variantStyles.default}`}>
      {label}
    </span>
  );
}
