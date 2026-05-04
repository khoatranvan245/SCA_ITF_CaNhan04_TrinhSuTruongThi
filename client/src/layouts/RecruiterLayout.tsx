import { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type StoredCompany = {
  name?: string;
  avatar_url?: string | null;
};

const RecruiterLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [company, setCompany] = useState<StoredCompany | null>(null);
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);

  const getRecruiterUserId = (): number | null => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser) as StoredUser;
      const isRecruiter = user?.role?.title?.toLowerCase() === "recruiter";

      if (!isRecruiter || typeof user.user_id !== "number") {
        return null;
      }

      return user.user_id;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const rawCompany = localStorage.getItem("company");

    if (rawCompany) {
      try {
        setCompany(JSON.parse(rawCompany) as StoredCompany);
      } catch {
        setCompany(null);
      }
    } else {
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    const recruiterUserId = getRecruiterUserId();
    if (!recruiterUserId) {
      return;
    }

    const controller = new AbortController();

    const fetchCompanyProfile = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/company-profile/${recruiterUserId}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok || !data.company) {
          return;
        }

        const nextCompany: StoredCompany = {
          name: data.company.name ?? "",
          avatar_url: data.company.avatar_url ?? null,
        };

        setCompany(nextCompany);
        setIsAvatarBroken(false);

        const rawCompany = localStorage.getItem("company");
        const parsedCompany = rawCompany ? JSON.parse(rawCompany) : {};
        localStorage.setItem(
          "company",
          JSON.stringify({ ...parsedCompany, ...data.company }),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    };

    void fetchCompanyProfile();

    return () => controller.abort();
  }, []);

  const menuItems = [
    {
      label: "Company Management",
      icon: "apartment",
      path: "/company-profile",
    },
    {
      label: "Job Management",
      icon: "work",
      path: "/job-management",
    },
    {
      label: "Applicant Management",
      icon: "people",
      path: "/application-management",
    },
  ];

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    navigate("/recruiter-login", { replace: true });
  };

  useEffect(() => {
    setIsAvatarBroken(false);
  }, [company?.avatar_url]);

  return (
    <div className="flex h-screen bg-surface text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#f7f9fb] dark:bg-slate-900 border-r border-outline-variant/20 flex flex-col py-6 px-4">
        <div className="mb-8 px-4">
          <span className="text-xl font-bold text-white tracking-tight">
            JobNest
          </span>
          <p className="text-xs text-secondary mt-1">Recruiter Dashboard</p>
        </div>

        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                isActive(item.path)
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/10"
                  : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom User Info */}
        <div className="border-t border-outline-variant/20 pt-4">
          <div className="flex items-center gap-3 px-4">
            {company?.avatar_url && !isAvatarBroken ? (
              <img
                src={company.avatar_url}
                alt={company.name || "Company avatar"}
                className="w-10 h-10 rounded-full object-cover border border-outline-variant/20"
                onError={() => setIsAvatarBroken(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  business
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {company?.name || "Company"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterLayout;
