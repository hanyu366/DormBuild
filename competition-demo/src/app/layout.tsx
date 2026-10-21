import type { Metadata } from "next";
import "./globals.css";
import { DormProvider } from "./DormProvider";

export const metadata: Metadata = {
  title: "DormMate AI - AI 宿舍协作看板",
  description: "面向学生宿舍的 AI 协作管理工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="antialiased">
      <body className="min-h-screen bg-warm-parchment text-olive-ink font-sans">
        <DormProvider>
          {children}
        </DormProvider>
      </body>
    </html>
  );
}
