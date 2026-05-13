import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type StoredUser = {
  user_id?: number;
  email?: string;
  full_name?: string | null;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type NotificationItem = {
  notification_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const Navbar = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isCandidateMenuOpen, setIsCandidateMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const candidateMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        candidateMenuRef.current &&
        !candidateMenuRef.current.contains(target)
      ) {
        setIsCandidateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const isCandidate =
    currentUser?.role?.role_id === 3 ||
    currentUser?.role?.title?.toLowerCase() === "candidate";

  const isLoggedIn = Boolean(currentUser?.email);
  const candidateUserId = currentUser?.user_id;
  const displayIdentity = currentUser?.full_name?.trim() || "Candidate";
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const loadNotifications = async () => {
    if (!isCandidate || !candidateUserId) {
      setNotifications([]);
      return;
    }

    setIsNotificationLoading(true);
    setNotificationError("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/candidate-profile/${candidateUserId}/notifications`,
      );
      const data = await response.json();

      if (!response.ok) {
        setNotificationError(data.message || "Failed to load notifications.");
        return;
      }

      setNotifications(data.notifications || []);
    } catch (loadError) {
      console.error("Load notifications error:", loadError);
      setNotificationError("An error occurred while loading notifications.");
    } finally {
      setIsNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isCandidate || !candidateUserId) {
      setNotifications([]);
      return;
    }

    void loadNotifications();
  }, [candidateUserId, isCandidate, isLoggedIn]);

  const clearAuthSession = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    setCurrentUser(null);
    setIsCandidateMenuOpen(false);
    setIsNotificationMenuOpen(false);
    setNotifications([]);
    setNotificationError("");
  };

  const buildRecruiterUrl = (path: string) => {
    const { protocol, hostname, port } = window.location;
    let targetHostname = hostname;

    if (!hostname.startsWith("recruiter.")) {
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        targetHostname = "recruiter.localhost";
      } else {
        targetHostname = `recruiter.${hostname}`;
      }
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const hostWithPort = port ? `${targetHostname}:${port}` : targetHostname;

    return `${protocol}//${hostWithPort}${normalizedPath}`;
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/job-listing");
  };

  const handleFindCandidates = () => {
    // Ensure switching to recruiter flow always starts from a clean session.
    clearAuthSession();
    window.location.assign(buildRecruiterUrl("/recruiter-login"));
  };

  const handleFindJobs = () => {
    navigate("/job-listing");
  };

  const handleFindCompanies = () => {
    navigate("/company-listing");
  };

  const handleCandidateMenuNavigate = (path: string) => {
    setIsCandidateMenuOpen(false);
    navigate(path);
  };

  const handleToggleNotifications = () => {
    setIsCandidateMenuOpen(false);

    setIsNotificationMenuOpen((previousValue) => {
      const nextValue = !previousValue;

      if (nextValue) {
        void loadNotifications();
      }

      return nextValue;
    });
  };

  return (
    <header className="bg-[#f7f9fb] dark:bg-slate-900 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center px-12 py-4 max-w-360 mx-auto">
        <div className="flex items-center gap-12">
          <a
            className="text-2xl font-bold tracking-tighter text-primary dark:text-white"
            href="#"
          >
            JobNest
          </a>
          <nav className="hidden lg:flex items-center gap-8 font-manrope text-base tracking-tight">
            <a
              className="text-secondary dark:text-slate-400 font-semibold hover:text-primary dark:hover:text-white transition-colors"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handleFindJobs();
              }}
            >
              Find Jobs
            </a>
            <a
              className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors font-semibold"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handleFindCompanies();
              }}
            >
              Companies
            </a>
            <a
              className="text-secondary dark:text-slate-400 font-semibold hover:text-primary dark:hover:text-blue-200 transition-colors"
              href="#"
            >
              About
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="px-5 py-2.5 text-sm font-semibold text-primary dark:text-blue-100 border border-primary dark:border-blue-400 rounded-lg cursor-pointer hover:bg-primary/10 hover:opacity-80 active:scale-95 transition-all duration-200"
            onClick={handleFindCandidates}
          >
            For Recruiter
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {isCandidate && (
                <>
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      className="relative px-4 py-2 rounded-lg bg-white border border-outline-variant/20 text-sm font-semibold text-primary flex items-center gap-2 hover:bg-surface-container-low transition-colors"
                      onClick={handleToggleNotifications}
                    >
                      <span className="material-symbols-outlined text-base">
                        notifications
                      </span>
                      <span className="hidden sm:inline">Notifications</span>
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[0.65rem] font-bold flex items-center justify-center">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </button>

                    {isNotificationMenuOpen && (
                      <div className="absolute right-0 mt-2 w-[24rem] max-w-[calc(100vw-1.5rem)] bg-white border border-outline-variant/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-outline-variant/10">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-on-surface">
                                Notifications
                              </p>
                              <p className="text-xs text-secondary">
                                {unreadNotificationCount > 0
                                  ? `${unreadNotificationCount} unread`
                                  : "All caught up"}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-secondary">
                              notifications_active
                            </span>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {isNotificationLoading ? (
                            <div className="px-4 py-6 text-sm text-secondary text-center">
                              Loading notifications...
                            </div>
                          ) : notificationError ? (
                            <div className="px-4 py-6 text-sm text-red-600 text-center">
                              {notificationError}
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-sm text-secondary text-center">
                              No notifications yet.
                            </div>
                          ) : (
                            <div className="p-3 space-y-3">
                              {notifications.map((notification) => (
                                <div
                                  key={notification.notification_id}
                                  className={`rounded-xl border px-4 py-3 ${
                                    notification.is_read
                                      ? "bg-surface-container-low border-outline-variant/10"
                                      : "bg-blue-50 border-blue-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-on-surface">
                                        {notification.title}
                                      </p>
                                      <p className="mt-1 text-sm text-secondary leading-6">
                                        {notification.message}
                                      </p>
                                    </div>
                                    {!notification.is_read && (
                                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                                    )}
                                  </div>
                                  <p className="mt-2 text-xs text-outline">
                                    {new Date(
                                      notification.created_at,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={candidateMenuRef}>
                    <button
                      className="px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/20 text-sm font-semibold text-primary flex items-center gap-2"
                      onClick={() => {
                        setIsNotificationMenuOpen(false);
                        setIsCandidateMenuOpen((prev) => !prev);
                      }}
                    >
                      <span>{displayIdentity}</span>
                      <span className="material-symbols-outlined text-base">
                        arrow_drop_down
                      </span>
                    </button>

                    {isCandidateMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-outline-variant/20 rounded-xl shadow-lg z-50 py-2">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          onClick={() =>
                            handleCandidateMenuNavigate("/candidate-profile")
                          }
                        >
                          Profile Management
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          onClick={() =>
                            handleCandidateMenuNavigate(
                              "/candidate-applications",
                            )
                          }
                        >
                          Application Management
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                className="px-5 py-2.5 text-sm font-semibold text-primary border border-primary/40 bg-white rounded-lg shadow-sm cursor-pointer hover:border-primary hover:bg-slate-100 hover:opacity-80 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all duration-200"
                onClick={() => navigate("/candidate-login")}
              >
                Login
              </button>
              <button
                className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-lg cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-200"
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
