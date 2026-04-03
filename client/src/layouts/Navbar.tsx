import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type StoredUser = {
  email?: string;
  role?: {
    role_id?: number;
    title?: string;
  };
};

const Navbar = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      setCurrentUser(null);
      return;
    }

    try {
      setCurrentUser(JSON.parse(rawUser));
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const isRecruiter =
    currentUser?.role?.role_id === 2 ||
    currentUser?.role?.title?.toLowerCase() === "recruiter";

  const isLoggedIn = Boolean(currentUser?.email);

  const clearAuthSession = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setCurrentUser(null);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/job-listing");
  };

  const handleFindCandidates = () => {
    // Ensure switching to recruiter flow always starts from a clean session.
    clearAuthSession();
    navigate("/recruiter-login");
  };

  return (
    <header className="bg-[#f7f9fb] dark:bg-slate-900 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center px-12 py-6 max-w-360 mx-auto">
        <div className="flex items-center gap-12">
          <a
            className="text-2xl font-bold tracking-tighter text-primary dark:text-white"
            href="#"
          >
            JobNest
          </a>
          <nav className="hidden lg:flex items-center gap-8 font-manrope text-base tracking-tight">
            <a
              className="text-primary dark:text-white font-semibold border-b-2 border-primary dark:border-blue-400 pb-1 transition-all"
              href="#"
            >
              Find Jobs
            </a>
            <a
              className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors font-medium"
              href="#"
            >
              Companies
            </a>
            <a
              className="text-secondary dark:text-slate-400 font-medium hover:text-primary dark:hover:text-blue-200 transition-colors"
              href="#"
            >
              About
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!isRecruiter && (
            <button
              className="px-5 py-2.5 text-sm font-semibold text-primary dark:text-blue-100 border border-primary dark:border-blue-400 rounded-lg hover:bg-primary/5 transition-all duration-200"
              onClick={handleFindCandidates}
            >
              Find Candidates
            </button>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm font-semibold text-primary">
                {currentUser?.email}
              </div>
              <button
                className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-all duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                className="px-5 py-2.5 text-sm font-medium text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-200 transition-colors"
                onClick={() => navigate("/candidate-login")}
              >
                Login
              </button>
              <button
                className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-lg hover:opacity-80 active:scale-95 transition-all duration-200"
                onClick={() => navigate("/candidate-signup")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
      <div className="bg-surface-container-low dark:bg-slate-800/50 h-px w-full"></div>
    </header>
  );
};

export default Navbar;
