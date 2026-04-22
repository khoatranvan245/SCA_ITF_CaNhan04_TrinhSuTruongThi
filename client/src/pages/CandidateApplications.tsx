import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type CandidateApplication = {
  application_id: number;
  status: string;
  created_at: string;
  job: {
    job_id: number;
    title: string;
    category: string;
    company_name: string;
    company_avatar_url: string | null;
    company_location: string;
  };
  resume: {
    resume_id: number;
    name: string;
  };
};

type ApplicationBadgeConfig = {
  className: string;
  dotClassName: string;
  label: string;
};

const statusConfig: Record<string, ApplicationBadgeConfig> = {
  submitted: {
    className: "bg-primary-fixed text-primary-container",
    dotClassName: "bg-primary-container",
    label: "Submitted",
  },
  pending: {
    className: "bg-primary-fixed text-primary-container",
    dotClassName: "bg-primary-container",
    label: "Pending",
  },
  success: {
    className: "bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-600",
    label: "Success",
  },
  accepted: {
    className: "bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-600",
    label: "Accepted",
  },
  reviewed: {
    className: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
    dotClassName: "bg-on-tertiary-fixed-variant",
    label: "Reviewed",
  },
  failed: {
    className: "bg-error-container text-on-error-container",
    dotClassName: "bg-error",
    label: "Failed",
  },
  rejected: {
    className: "bg-error-container text-on-error-container",
    dotClassName: "bg-error",
    label: "Rejected",
  },
};

const formatAppliedDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getStoredCandidateUser = (): StoredUser | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

const CandidateApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const candidateUserId = useMemo(() => {
    const user = getStoredCandidateUser();
    const roleTitle = user?.role?.title?.toLowerCase();

    if (
      user?.role?.role_id === 1 ||
      user?.role?.role_id === 3 ||
      roleTitle === "candidate"
    ) {
      return typeof user.user_id === "number" ? user.user_id : null;
    }

    return null;
  }, []);

  useEffect(() => {
    if (!candidateUserId) {
      navigate("/candidate-login", { replace: true });
      return;
    }

    const controller = new AbortController();

    const fetchApplications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/api/candidate-profile/${candidateUserId}/applications`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load applications");
          return;
        }

        setApplications(
          Array.isArray(data.applications) ? data.applications : [],
        );
        setCurrentPage(1);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setError("An error occurred while loading applications.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchApplications();

    return () => controller.abort();
  }, [candidateUserId, navigate]);

  const totalSubmitted = applications.length;
  const totalPages = Math.max(1, Math.ceil(totalSubmitted / itemsPerPage));
  const currentApplications = applications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return (
    <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[3.5rem] font-extrabold text-primary tracking-tight leading-tight mb-4">
            My Applications
          </h1>
          <div className="flex items-center gap-8 text-secondary">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{totalSubmitted}</span>
              <span className="text-sm font-medium tracking-wide">
                TOTAL SUBMITTED
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold tracking-wide shadow-lg shadow-primary/10 hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined text-lg">
              filter_list
            </span>
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 ring-1 ring-outline-variant/10 text-secondary">
            Loading applications...
          </div>
        ) : error ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 ring-1 ring-outline-variant/10 text-red-600">
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 ring-1 ring-outline-variant/10 text-secondary">
            You have not applied to any jobs yet.
          </div>
        ) : (
          currentApplications.map((application) => {
            const badge =
              statusConfig[application.status.toLowerCase()] ??
              statusConfig.submitted;

            return (
              <div
                key={application.application_id}
                className="group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] ring-1 ring-outline-variant/10"
              >
                <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center p-3 shrink-0 overflow-hidden">
                    {application.job.company_avatar_url ? (
                      <img
                        alt="Company Logo"
                        className="w-full h-full object-contain"
                        src={application.job.company_avatar_url}
                      />
                    ) : (
                      <span className="text-xl font-extrabold text-blue-900">
                        {application.job.company_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-surface-tint transition-colors">
                      {application.job.title}
                    </h3>
                    <p className="text-secondary font-medium mt-0.5">
                      {application.job.company_name} •{" "}
                      <span className="text-sm text-outline">
                        {application.job.category}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[140px_160px_48px] items-center gap-4 w-full md:w-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                      Applied on
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {formatAppliedDate(application.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                      Status
                    </span>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${badge.className}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${badge.dotClassName} mr-2`}
                        ></span>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="p-2 rounded-xl hover:bg-surface-container-low text-primary transition-colors"
                      type="button"
                      onClick={() =>
                        navigate(`/jobs/${application.job.job_id}`)
                      }
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <nav className="flex items-center gap-2">
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                  currentPage === page
                    ? "bg-primary text-on-primary"
                    : "text-primary hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ),
          )}
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </nav>
      </div>
    </main>
  );
};

export default CandidateApplications;
