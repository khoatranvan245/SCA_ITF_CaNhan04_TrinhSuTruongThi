import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layouts/Navbar";
import Footer from "../layouts/Footer";

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type RecruiterJob = {
  job_id: number;
  title: string;
  status: "open" | "closed" | "pending" | "expired";
  created_at: string;
  category: string;
  applicants_count: number;
  location: string;
};

const statusBadgeClasses: Record<RecruiterJob["status"], string> = {
  open: "bg-green-100 text-green-800",
  pending: "bg-orange-100 text-orange-800",
  closed: "bg-slate-200 text-slate-700",
  expired: "bg-red-100 text-red-800",
};

const statusDotClasses: Record<RecruiterJob["status"], string> = {
  open: "bg-green-500",
  pending: "bg-orange-500",
  closed: "bg-slate-500",
  expired: "bg-red-500",
};

const statusLabels: Record<RecruiterJob["status"], string> = {
  open: "Active",
  pending: "Pending",
  closed: "Closed",
  expired: "Expired",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const JobManagement = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
  const isRecruiter =
    parsedUser?.role?.role_id === 2 ||
    parsedUser?.role?.title?.toLowerCase() === "recruiter";

  useEffect(() => {
    if (!userId || !isRecruiter) {
      navigate("/recruiter-login", { replace: true });
      return;
    }

    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/api/jobs/recruiter/${userId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load jobs");
          return;
        }

        setJobs(data.jobs || []);
      } catch (err) {
        setError("An error occurred while loading jobs.");
        console.error("Fetch recruiter jobs error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [isRecruiter, navigate, userId]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return jobs;
    }

    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query),
    );
  }, [jobs, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* TopNavBar  */}
      <Navbar />
      {/* Main Content  */}
      <main className="grow w-full max-w-360 mx-auto px-12 py-12">
        {/* Header Section  */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="font-label text-[0.75rem] uppercase tracking-widest text-secondary mb-2 block">
              RECRUITER DASHBOARD
            </span>
            <h1 className="font-headline text-[3.5rem] font-extrabold tracking-tight text-primary leading-none">
              Job Management
            </h1>
          </div>
          <button
            onClick={() => navigate("post")}
            className="bg-primary text-on-primary px-8 py-4 rounded-xl font-medium flex items-center gap-3 hover:opacity-90 transition-opacity shadow-lg"
          >
            <span className="material-symbols-outlined">add</span>
            Post a Job
          </button>
        </div>
        {/* Job Listings Table  */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="px-8 py-6 bg-surface-container-low flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold text-primary">
              Active Listings
            </h2>
            <div className="flex gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-fixed w-64"
                  placeholder="Filter jobs..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="font-label text-[0.65rem] uppercase tracking-widest text-secondary border-b border-outline-variant/10">
                  <th className="px-8 py-4 font-semibold">Job Title</th>
                  <th className="px-8 py-4 font-semibold">Date Posted</th>
                  <th className="px-8 py-4 font-semibold text-center">
                    Applicants
                  </th>
                  <th className="px-8 py-4 font-semibold">Status</th>
                  <th className="px-8 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {isLoading ? (
                  <tr>
                    <td
                      className="px-8 py-8 text-sm text-secondary text-center"
                      colSpan={5}
                    >
                      Loading jobs...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      className="px-8 py-8 text-sm text-red-600 text-center"
                      colSpan={5}
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td
                      className="px-8 py-8 text-sm text-secondary text-center"
                      colSpan={5}
                    >
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr
                      key={job.job_id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">
                              work
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-primary">
                              {job.title}
                            </div>
                            <div className="text-xs text-secondary">
                              {job.location} • {job.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-secondary">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
                          {job.applicants_count}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`${statusBadgeClasses[job.status]} px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider flex items-center w-fit gap-1`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[job.status]}`}
                          ></span>
                          {statusLabels[job.status]}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-secondary transition-colors"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">
                              edit
                            </span>
                          </button>
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container hover:text-error text-secondary transition-colors"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Updated Pagination Section  */}
          <div className="px-8 py-4 bg-surface-container-low flex justify-between items-center">
            <span className="text-[0.7rem] font-label text-secondary uppercase tracking-widest">
              Showing {filteredJobs.length} of {jobs.length} listings
            </span>
            <nav className="flex items-center gap-2">
              <button
                className="text-[0.7rem] font-label text-secondary uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-2"
                disabled
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold transition-all shadow-sm">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-secondary text-xs font-bold transition-all">
                  2
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest text-secondary text-xs font-bold transition-all">
                  3
                </button>
              </div>
              <button className="text-[0.7rem] font-label text-secondary uppercase tracking-widest hover:text-primary transition-colors px-2">
                Next
              </button>
            </nav>
          </div>
        </div>
      </main>
      {/* Footer  */}
      <Footer />
    </div>
  );
};

export default JobManagement;
