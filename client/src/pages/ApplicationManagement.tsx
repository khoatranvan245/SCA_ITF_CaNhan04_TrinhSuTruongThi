import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type StoredUser = {
  user_id?: number;
  role?: {
    title?: string;
  };
};

type CompanySummary = {
  company_id: number;
  name: string;
};

type JobApplication = {
  application_id: number;
  status: string;
  created_at: string;
  job?: {
    job_id: number;
    title: string;
  };
  ai_evaluation?: {
    score: number | null;
    matching_skills: string;
    missing_skills: string;
    summary: string;
  } | null;
  candidate: {
    candidate_id: number;
    full_name: string;
    email: string;
    location: string;
    avatar_url?: string;
  };
  resume: {
    resume_id: number;
    name: string;
    file_url: string;
  };
};

type JobData = {
  job_id: number;
  title: string;
  created_at: string;
};

const statusBadgeClasses: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-orange-100 text-orange-800",
  success: "bg-green-100 text-green-800",
  accepted: "bg-green-100 text-green-800",
  reviewed: "bg-purple-100 text-purple-800",
  failed: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
};

const statusDotClasses: Record<string, string> = {
  submitted: "bg-blue-500",
  pending: "bg-orange-500",
  success: "bg-green-500",
  accepted: "bg-green-500",
  reviewed: "bg-purple-500",
  failed: "bg-red-500",
  rejected: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  pending: "Pending",
  success: "Success",
  accepted: "Accepted",
  reviewed: "Reviewed",
  failed: "Failed",
  rejected: "Rejected",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const getScoreBadgeClass = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return "bg-surface-container-high text-secondary";
  }

  if (score >= 80) {
    return "bg-green-100 text-green-800";
  }

  if (score >= 60) {
    return "bg-blue-100 text-blue-800";
  }

  if (score >= 40) {
    return "bg-orange-100 text-orange-800";
  }

  return "bg-red-100 text-red-800";
};

const ApplicationManagement = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId?: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const rawUser = useMemo(() => localStorage.getItem("user"), []);

  const parsedUser = useMemo(() => {
    if (!rawUser) {
      return null;
    }
    try {
      return JSON.parse(rawUser) as StoredUser;
    } catch {
      return null;
    }
  }, [rawUser]);

  const userId = parsedUser?.user_id;
  const isRecruiter = parsedUser?.role?.title?.toLowerCase() === "recruiter";
  const isJobView = Boolean(jobId);
  const showJobCol = !isJobView;
  const showAiCol = isJobView;
  const emptyColSpan = 4 + (showJobCol ? 1 : 0) + (showAiCol ? 1 : 0);

  useEffect(() => {
    if (!userId || !isRecruiter) {
      if (!userId || !isRecruiter) {
        navigate("/recruiter-login", { replace: true });
      }
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const endpoint = jobId
          ? `http://localhost:3000/api/jobs/${jobId}/applications`
          : `http://localhost:3000/api/jobs/recruiter/${userId}/applications`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load applications");
          return;
        }

        setJob(data.job || null);
        setCompany(data.company || null);
        setApplications(data.applications || []);
      } catch (err) {
        setError("An error occurred while loading applications.");
        console.error("Fetch applications error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [isRecruiter, navigate, userId, jobId]);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return applications;
    }

    return applications.filter(
      (app) =>
        app.candidate.full_name.toLowerCase().includes(query) ||
        app.candidate.email.toLowerCase().includes(query) ||
        app.candidate.location.toLowerCase().includes(query),
    );
  }, [applications, searchQuery]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(
    startIndex,
    endIndex,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <main className="w-full max-w-360 mx-auto px-12 py-12 selection:bg-primary-container selection:text-on-primary">
        <div className="text-center py-12">
          <p className="text-secondary">Loading applications...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="w-full max-w-360 mx-auto px-12 py-12 selection:bg-primary-container selection:text-on-primary">
        <header className="mb-12">
          <button
            onClick={() => navigate("/job-management")}
            className="inline-flex items-center text-secondary text-sm font-medium mb-4 hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined mr-1 text-sm">
              arrow_back
            </span>
            Back to Jobs
          </button>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 lg:gap-10">
            <div className="w-full lg:max-w-3xl">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2">
                {job?.title || company?.name || "Application Management"}
              </h1>
              <div className="flex items-center gap-4 text-secondary mb-6">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    schedule
                  </span>
                  {job
                    ? `Posted ${formatDate(job.created_at)}`
                    : company
                      ? `All applications for ${company.name}`
                      : "All company applications"}
                </span>
              </div>
              <div className="mt-8 border-t border-outline-variant/20 pt-8">
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-secondary mb-1">
                    Total Applicants
                  </span>
                  <span className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
                    {applications.length}
                  </span>
                </div>
              </div>
            </div>
            <section className="w-full lg:w-auto lg:min-w-[24rem] lg:pt-16">
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  search
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all placeholder:text-outline/70"
                  placeholder="Search candidates by name or email..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </section>
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-error-container text-error rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-secondary">
                <th className="w-[30%] px-8 py-5 font-bold text-[0.7rem] uppercase tracking-wider">
                  Candidate
                </th>
                <th className="w-[16%] px-6 py-5 font-bold text-[0.7rem] uppercase tracking-wider whitespace-nowrap">
                  Applied Date
                </th>
                {showJobCol && (
                  <th className="px-6 py-5 font-bold text-[0.7rem] uppercase tracking-wider">
                    Job
                  </th>
                )}
                <th className="px-6 py-5 font-bold text-[0.7rem] uppercase tracking-wider">
                  Status
                </th>
                {showAiCol && (
                  <th className="px-6 py-5 font-bold text-[0.7rem] uppercase tracking-wider whitespace-nowrap">
                    AI Score
                  </th>
                )}
                <th className="px-6 py-5 font-bold text-[0.7rem] uppercase tracking-wider">
                  Email Address
                </th>

              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={emptyColSpan}
                    className="px-8 py-8 text-center text-secondary text-sm"
                  >
                    {applications.length === 0
                      ? "No applications yet"
                      : "No results found"}
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((application) => (
                  <tr
                    key={application.application_id}
                    className="hover:bg-surface-container/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {application.candidate.avatar_url ? (
                          <img
                            className="w-12 h-12 rounded-full object-cover"
                            src={application.candidate.avatar_url}
                            alt={application.candidate.full_name}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                            <span className="material-symbols-outlined">
                              person
                            </span>
                          </div>
                        )}
                        <div>
                          <button
                            type="button"
                            className="text-left font-bold text-primary hover:text-primary-container transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/application-management/${application.job?.job_id || job?.job_id}/${application.application_id}`,
                                {
                                  state: {
                                    application,
                                    job: application.job || job,
                                  },
                                },
                              )
                            }
                          >
                            {application.candidate.full_name}
                          </button>
                          <p className="text-sm text-secondary">
                            {application.candidate.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-secondary">
                      {formatDate(application.created_at)}
                    </td>
                    {showJobCol && (
                      <td className="px-6 py-6 text-sm text-secondary font-medium">
                        {application.job?.title || job?.title || "Job"}
                      </td>
                    )}
                    <td className="px-6 py-6">
                      <span
                        className={`${
                          statusBadgeClasses[application.status] ||
                          "bg-gray-100 text-gray-800"
                        } px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider flex items-center w-fit gap-1`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            statusDotClasses[application.status] ||
                            "bg-gray-500"
                          }`}
                        ></span>
                        {statusLabels[application.status] || application.status}
                      </span>
                    </td>
                    {showAiCol && (
                      <td className="px-6 py-6">
                        {application.ai_evaluation?.score === null ||
                        application.ai_evaluation?.score === undefined ? (
                          <span className="text-sm text-secondary">
                            Evaluating...
                          </span>
                        ) : (
                          <span
                            className={`${getScoreBadgeClass(
                              application.ai_evaluation.score,
                            )} inline-flex items-center rounded-full px-3 py-1 text-xs font-bold`}
                            title={application.ai_evaluation.summary}
                          >
                            {application.ai_evaluation.score}%
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-6 text-sm text-secondary font-medium">
                      {application.candidate.email}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {applications.length > 0 && (
            <div className="px-8 py-6 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/15">
              <p className="text-sm text-secondary">
                Showing{" "}
                <span className="font-bold text-primary">
                  {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredApplications.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-primary">
                  {filteredApplications.length}
                </span>{" "}
                applicants
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all text-xs ${
                        currentPage === page
                          ? "bg-primary text-on-primary shadow-sm"
                          : "hover:bg-surface-container-high text-secondary"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ApplicationManagement;
