import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import Shell from "./components/Shell";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PlanRoczny from "./pages/PlanRoczny";
import Nawyki from "./pages/Nawyki";
import Obowiazki from "./pages/Obowiazki";
import Finanse from "./pages/Finanse";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="plan-roczny" element={<PlanRoczny />} />
            <Route path="nawyki" element={<Nawyki />} />
            <Route path="obowiazki" element={<Obowiazki />} />
            <Route path="finanse" element={<Finanse />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}
