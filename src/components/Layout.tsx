import { Link, useLocation } from "react-router-dom";
import { Home, Plus, FileText, Settings } from "lucide-react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/new-entry", icon: Plus, label: "Neuer Eintrag" },
    { path: "/protocol", icon: FileText, label: "Protokoll" },
    { path: "/settings", icon: Settings, label: "Einstellungen" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="w-fit">
            <h1 className="text-2xl font-bold text-primary">
              Lüftungsprotokoll Digital
            </h1>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elegant">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
