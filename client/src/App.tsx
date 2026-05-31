import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExpensePage } from "@/pages/ExpensePage";
import { ConventionPage } from "@/pages/ConventionPage";
import { VotePage } from "@/pages/VotePage";
import { AnonymousPage } from "@/pages/AnonymousPage";
import { WeatherPage } from "@/pages/WeatherPage";
import { AiChatBubble } from "@/components/ai/AiChatBubble";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/expense" element={<ExpensePage />} />
                <Route path="/convention" element={<ConventionPage />} />
                <Route path="/vote" element={<VotePage />} />
                <Route path="/anonymous" element={<AnonymousPage />} />
                <Route path="/weather" element={<WeatherPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <AiChatBubble />
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
