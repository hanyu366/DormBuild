import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { useSocket } from "@/hooks/useSocket";
import { connectSocket } from "@/services/socket";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { AnimatePresence, motion } from "framer-motion";

export function AppLayout() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  useSocket();

  useEffect(() => {
    if (token) {
      connectSocket();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
