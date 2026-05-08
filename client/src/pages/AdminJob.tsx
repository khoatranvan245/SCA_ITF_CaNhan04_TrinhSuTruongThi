import { useEffect, useMemo, useState } from "react";

type AdminJobStatus = "open" | "paused" | "closed" | "expired";

type AdminJob = {
  job_id: number;
  title: string;
  company_name: string;
  company_avatar_url: string | null;
  category: string;
  location: string;
  created_at: string;
  expiration_date: string | null;
  status: AdminJobStatus;
  applicants_count: number;
};

const statusLabelMap: Record<AdminJobStatus, string> = {
  open: "Open",
  paused: "Paused",
  closed: "Closed",
  expired: "Expired",
};

const statusBadgeMap: Record<AdminJobStatus, string> = {
  open: "bg-emerald-100 text-emerald-700",
  paused: "bg-orange-100 text-orange-700",
  closed: "bg-slate-100 text-slate-700",
  expired: "bg-red-100 text-red-700",
};

const filters = [
  { label: "All Statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Paused", value: "paused" },
  { label: "Closed", value: "closed" },
  { label: "Expired", value: "expired" },
] as const;

const formatDate = (value: string | null) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminJob = () => {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<AdminJobStatus | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const [editingStatuses, setEditingStatuses] = useState<
    Record<number, AdminJobStatus>
  >({});
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/jobs/admin/jobs",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load admin jobs.");
          return;
        }

        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (loadError) {
        console.error("Load admin jobs error:", loadError);
        setError("An error occurred while loading jobs.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobs();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/jobs/categories",
        );
        const data = await response.json();

        if (response.ok && Array.isArray(data.categories)) {
          const categoryTitles = data.categories.map(
            (cat: { title: string }) => cat.title,
          );
          setAllCategories(categoryTitles);
        }
      } catch (error) {
        console.error("Load categories error:", error);
      }
    };

    void fetchCategories();
  }, []);

  useEffect(() => {
    if (openStatusMenuId === null) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target?.closest("[data-status-menu]")) {
        setOpenStatusMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [openStatusMenuId]);

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/jobs/admin/${jobId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update job status");
        return;
      }

      // Update local job list
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.job_id === jobId
            ? { ...job, status: newStatus as AdminJobStatus }
            : job,
        ),
      );

      // Clear editing state
      setEditingStatuses((prev) => {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      });
    } catch (error) {
      console.error("Status update error:", error);
      alert("An error occurred while updating job status");
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/jobs/admin/${jobId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Failed to delete job");
        return;
      }

      // Remove job from list
      setJobs((prevJobs) => prevJobs.filter((job) => job.job_id !== jobId));
      setExpandedJobId(null);
    } catch (error) {
      console.error("Delete job error:", error);
      alert("An error occurred while deleting the job");
    }
  };

  const toggleExpandRow = (jobId: number) => {
    setExpandedJobId((currentExpandedJobId) =>
      currentExpandedJobId === jobId ? null : jobId,
    );
    setOpenStatusMenuId(null);
  };

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesCategory = category === "all" || job.category === category;
      const matchesStatus = status === "all" || job.status === status;
      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.company_name.toLowerCase().includes(query) ||
        job.category.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);

      return matchesCategory && matchesStatus && matchesQuery;
    });
  }, [category, jobs, searchQuery, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchQuery, status]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const counts = useMemo(() => {
    return jobs.reduce(
      (accumulator, job) => {
        accumulator.total += 1;
        accumulator[job.status] += 1;
        return accumulator;
      },
      { total: 0, open: 0, paused: 0, closed: 0, expired: 0 },
    );
  }, [jobs]);

  return (
    <main className="px-6 md:px-8 py-8 md:py-10">
      <section className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0e1c35] leading-tight">
            Manage job postings and status
          </h1>
          <p className="mt-2 text-sm text-[#64708a]">
            Admin Dashboard • Review live job posts from all companies.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Jobs
            </div>
            <div className="text-2xl font-extrabold text-[#0e1c35]">
              {counts.total}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Open
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {counts.open}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Paused
            </div>
            <div className="text-2xl font-extrabold text-orange-600">
              {counts.paused}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Closed
            </div>
            <div className="text-2xl font-extrabold text-slate-600">
              {counts.closed}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Expired
            </div>
            <div className="text-2xl font-extrabold text-red-600">
              {counts.expired}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white border border-[#e4e8f0] shadow-[0_20px_45px_rgba(16,24,40,0.06)] overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#eef1f6] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatus(item.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      status === item.value
                        ? "bg-[#0d2446] text-white shadow-sm"
                        : "bg-[#f6f8fc] text-[#50617b] hover:bg-[#eef3f9]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-[0.7rem] font-bold uppercase text-[#8793a8]">
                  Category
                </label>
                <select
                  className="h-11 rounded-xl border border-[#e3e8f0] bg-[#f6f8fc] px-4 text-sm text-[#0e1c35] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full lg:w-[20rem] relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96a2b6] text-[18px]">
                search
              </span>
              <input
                className="w-full h-11 rounded-xl border border-[#e3e8f0] bg-[#f6f8fc] pl-11 pr-4 text-sm text-[#0e1c35] placeholder:text-[#96a2b6] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                placeholder="Search jobs..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190">
              <thead className="bg-[#f8fafc] text-[#8a96aa] text-[0.65rem] uppercase font-bold">
                <tr>
                  <th className="px-6 md:px-8 py-4 text-left">Job Title</th>
                  <th className="px-6 md:px-8 py-4 text-left">Company</th>
                  <th className="px-6 md:px-8 py-4 text-left">Posted Date</th>
                  <th className="px-6 md:px-8 py-4 text-left">Status</th>
                  <th className="px-6 md:px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={5}
                    >
                      Loading jobs...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-red-600"
                      colSpan={5}
                    >
                      {error}
                    </td>
                  </tr>
                ) : paginatedJobs.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={5}
                    >
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => (
                    <>
                      <tr
                        key={job.job_id}
                        className="border-t border-[#eef1f6] hover:bg-[#fafcff] transition-colors cursor-pointer"
                        onClick={() => toggleExpandRow(job.job_id)}
                      >
                        <td className="px-6 md:px-8 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#edf3fb] flex items-center justify-center overflow-hidden shrink-0">
                              {job.company_avatar_url ? (
                                <img
                                  src={job.company_avatar_url}
                                  alt={job.company_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[#6480aa]">
                                  work
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0e1c35]">
                                {job.title}
                              </p>
                              <p className="text-xs text-[#8491a6]">
                                ID: JB-{String(job.job_id).padStart(4, "0")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <div>
                            <p className="font-medium">{job.company_name}</p>
                            <p className="text-xs text-[#8491a6]">
                              {job.category}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          {formatDate(job.created_at)}
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <span
                            className={`${statusBadgeMap[job.status]} inline-flex items-center px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase`}
                          >
                            {statusLabelMap[job.status]}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#eef3f9] text-[#60708b]"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpandRow(job.job_id);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {expandedJobId === job.job_id
                                ? "expand_less"
                                : "expand_more"}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {expandedJobId === job.job_id && (
                        <tr className="border-t border-[#eef1f6] bg-[#f8fafc]">
                          <td colSpan={5} className="px-6 md:px-8 py-6">
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                  <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                    Expiration Date
                                  </p>
                                  <p className="text-sm font-semibold text-[#0e1c35]">
                                    {formatDate(job.expiration_date)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                    Applications
                                  </p>
                                  <p className="text-sm font-semibold text-[#0e1c35]">
                                    {job.applicants_count}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                    Location
                                  </p>
                                  <p className="text-sm font-semibold text-[#0e1c35]">
                                    {job.location}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                    Category
                                  </p>
                                  <p className="text-sm font-semibold text-[#0e1c35]">
                                    {job.category}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                <div className="flex-1">
                                  <label className="text-xs font-bold uppercase text-[#8793a8] mb-2 block">
                                    Change Status
                                  </label>
                                  <div className="flex gap-2 items-center">
                                    <div
                                      className="relative flex-1"
                                      data-status-menu
                                    >
                                      <button
                                        type="button"
                                        className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e3e8f0] bg-white px-3 text-sm font-medium text-[#0e1c35] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setOpenStatusMenuId((current) =>
                                            current === job.job_id
                                              ? null
                                              : job.job_id,
                                          );
                                        }}
                                      >
                                        <span>
                                          {
                                            statusLabelMap[
                                              editingStatuses[job.job_id] ||
                                                job.status
                                            ]
                                          }
                                        </span>
                                        <span className="material-symbols-outlined text-[18px] text-[#8090a6]">
                                          {openStatusMenuId === job.job_id
                                            ? "expand_less"
                                            : "expand_more"}
                                        </span>
                                      </button>

                                      {openStatusMenuId === job.job_id && (
                                        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-[#e3e8f0] bg-white shadow-lg">
                                          {(
                                            [
                                              "open",
                                              "paused",
                                              "closed",
                                            ] as AdminJobStatus[]
                                          ).map((option) => (
                                            <button
                                              key={option}
                                              type="button"
                                              className="block w-full px-3 py-2 text-left text-sm text-[#0e1c35] hover:bg-[#eef3f9]"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                setEditingStatuses((prev) => ({
                                                  ...prev,
                                                  [job.job_id]: option,
                                                }));
                                                setOpenStatusMenuId(null);
                                              }}
                                            >
                                              {statusLabelMap[option]}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newStatus =
                                          editingStatuses[job.job_id] ||
                                          job.status;
                                        if (newStatus !== job.status) {
                                          void handleStatusChange(
                                            job.job_id,
                                            newStatus,
                                          );
                                        }
                                      }}
                                      className="px-4 py-2.5 rounded-lg bg-[#0d2446] text-white font-semibold hover:opacity-90 transition-colors whitespace-nowrap text-sm"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleDeleteJob(job.job_id);
                                  }}
                                  className="px-4 py-2.5 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors whitespace-nowrap text-sm"
                                >
                                  Delete Job
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 md:px-8 py-5 border-t border-[#eef1f6] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-bold uppercase text-[#6f7f98]">
              Showing {filteredJobs.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, filteredJobs.length)} of {filteredJobs.length}{" "}
              jobs
            </p>

            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-[#8c97a8] hover:bg-[#f1f5fa] disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(0, 4)
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg font-semibold ${
                        currentPage === page
                          ? "bg-[#0d2446] text-white shadow-sm"
                          : "text-[#5d6d85] hover:bg-[#f1f5fa]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                {totalPages > 4 && (
                  <span className="px-2 text-[#90a0b6]">...</span>
                )}
                {totalPages > 4 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-9 h-9 rounded-lg font-semibold ${
                      currentPage === totalPages
                        ? "bg-[#0d2446] text-white shadow-sm"
                        : "text-[#5d6d85] hover:bg-[#f1f5fa]"
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-[#5d6d85] hover:bg-[#f1f5fa] disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminJob;
