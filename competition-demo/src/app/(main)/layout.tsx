"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDorm } from "@/app/DormProvider";
import BottomNav from "@/components/BottomNav";
import AiBubble from "@/components/AiBubble";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { session } = useDorm();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  if (!session) return null;

  return (
    <>
      <main className="pb-16 px-4 pt-2 max-w-2xl mx-auto">{children}</main>
      <BottomNav />
      <AiBubble />
    </>
  );
}
