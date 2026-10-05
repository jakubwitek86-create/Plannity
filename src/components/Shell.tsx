import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Home, Target, Activity, ListChecks, Wallet, LogOut } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home, exact: true },
  { to: "/plan-roczny", label: "Plan Roczny", icon: Target, exact: false },
  { to: "/nawyki", label: "Nawyki", icon: Activity, exact: false },
  { to: "/obowiazki", label: "Obowiązki", icon: ListChecks, exact: false },
  { to: "/finanse", label: "Finanse", icon: Wallet, exact: false },
] as const;

export default function Shell() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  }

  const isActive = (to: string, exact: boolean) => (exact ? loc.pathname === to : loc.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Plannity</h1>
          <p className="text-xs text-muted-foreground mt-1 truncate">{email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const active = isActive(n.to, n.exact);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Icon size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted"
        >
          <LogOut size={16} /> Wyloguj
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-xl font-bold text-primary">Plannity</h1>
          <button onClick={logout} className="text-muted-foreground p-2">
            <LogOut size={18} />
          </button>
        </header>
        <div className="flex-1 pb-20 md:pb-8">
          <Outlet />
        </div>
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-40">
          <div className="grid grid-cols-5">
            {NAV.map((n) => {
              const active = isActive(n.to, n.exact);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon size={20} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
