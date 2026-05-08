import { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

type StoredUser = {
  email?: string;
  role?: {
    title?: string;
  };
};

type MenuItem = {
  label: string;
  icon: string;
  path: string;
};

const menuItems: MenuItem[] = [
  {
    label: "Company",
    icon: "domain",
    path: "/companies",
  },
  { label: "Job", icon: "work", path: "/jobs" },
  {
    label: "Account",
    icon: "person",
    path: "/accounts",
  },
  { label: "Reports", icon: "bar_chart", path: "/reports" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(rawUser) as StoredUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f3f5f9] text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-20 w-[18rem] border-r border-[#e2e6ee] bg-[#f7f9fd] flex flex-col px-5 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.45)]">
        <div className="px-3 mb-10">
          <div className="text-2xl font-extrabold tracking-tight text-[#0e1c35]">
            JobNest
          </div>
        </div>

        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? "bg-[#0d2446] text-white shadow-[0_10px_24px_rgba(13,36,70,0.22)]"
                  : "text-[#42526b] hover:bg-white hover:text-[#0d2446]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                  isActive(item.path) ? "bg-white/10" : "bg-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-6">
          <div className="rounded-2xl bg-white border border-[#e4e8f0] shadow-sm p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#223e61] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(user?.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0e1c35] truncate">
                {user?.email || "Admin User"}
              </p>
              <p className="text-xs text-[#66758f] truncate">
                {user?.role?.title || "Super Admin"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto w-9 h-9 rounded-full border border-[#e4e8f0] flex items-center justify-center text-[#66758f] hover:text-[#0d2446] hover:border-[#0d2446] transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-72 h-screen overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
