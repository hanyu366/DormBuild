"use client";

import type { ReactNode } from "react";

export default function CardShell({
  variant = "bordered",
  title,
  children,
  className = "",
}: {
  variant?: "bordered" | "sage";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const base = variant === "sage" ? "card-sage" : "card-bordered";
  return (
    <div className={`${base} p-4 mb-4 ${className}`}>
      {title && <h3 className="text-base font-bold text-deep-olive mb-2">{title}</h3>}
      {children}
    </div>
  );
}
