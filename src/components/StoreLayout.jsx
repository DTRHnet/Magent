import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Zap, LayoutDashboard, Bot, Store, LogIn, LogOut } from "lucide-react";

export default function StoreLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const nav = [
    { to: "/", label: "Store", icon: Store },
    { to: "/dashboard", label: "Revenue", icon: LayoutDashboard },
    { to: "/agent", label: "AI CEO", icon: Bot },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Zap className="h-5 w-5" /></span>
            <span className="hidden sm:inline">AutoRevenue Engine</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Button key={item.to} asChild variant={active ? "default" : "ghost"} size="sm">
                  <Link to={item.to}><item.icon className="h-4 w-4 mr-1" />{item.label}</Link>
                </Button>
              );
            })}
            {isAuthenticated && user ? (
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-1" />Logout
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm"><Link to="/login?returnTo=/dashboard"><LogIn className="h-4 w-4 mr-1" />Admin</Link></Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">AutoRevenue Engine — autonomous digital products, earning 24/7.</div>
      </footer>
    </div>
  );
}