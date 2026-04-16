import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layouts/Navbar";
import Footer from "../layouts/Footer";

type PublicJob = {
  job_id: number;
  title: string;
  company_name: string;
  company_avatar_url: string | null;
  category: string;
  location: string;
  created_at: string;
  salary_label: string;
  skills: string[];
};

const getPostedLabel = (createdAt: string) => {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return "Posted recently";
  }

  const diffMs = Date.now() - createdTime;
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `Posted ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `Posted ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `Posted ${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
};

const JobListing = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("http://localhost:3000/api/jobs");
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load jobs");
          return;
        }

        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (loadError) {
        console.error("Load public jobs error:", loadError);
        setError("An error occurred while loading job listings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const l = locationQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company_name.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        job.skills.some((skill) => skill.toLowerCase().includes(q));

      const matchesLocation = !l || job.location.toLowerCase().includes(l);

      return matchesQuery && matchesLocation;
    });
  }, [jobs, locationQuery, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const visibleCountText = `Showing ${startIndex + 1}-${Math.min(endIndex, filteredJobs.length)} of ${filteredJobs.length} results`;

  return (
    <div className="bg-surface selection:bg-primary-fixed selection:text-primary min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full max-w-360 mx-auto px-12 py-12 grow">
        <section className="mb-20">
          <div className="max-w-4xl">
            <h1 className="text-primary font-headline font-extrabold text-5xl tracking-tight mb-8 leading-[1.1]">
              Discover your{" "}
              <span className="text-surface-tint">next chapter</span>.
            </h1>
          </div>
          <div className="bg-white shadow-xl shadow-slate-200/50 p-1.5 rounded-2xl flex flex-row items-center gap-2 border border-slate-100">
            <div className="grow relative flex items-center border-r border-slate-100">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                search
              </span>
              <input
                className="w-full bg-transparent border-none py-5 pl-14 pr-5 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-base"
                placeholder="Search roles, skills, or companies..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="w-1/4 relative flex items-center">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                location_on
              </span>
              <input
                className="w-full bg-transparent border-none py-5 pl-14 pr-5 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-base"
                placeholder="Location"
                type="text"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
              />
            </div>
            <button className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold text-base hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
              Find Jobs
            </button>
          </div>
        </section>

        <div className="flex items-end justify-between mb-10 border-b border-outline-variant/15 pb-6">
          <div>
            <span className="text-[0.7rem] font-bold tracking-[0.25em] text-secondary uppercase mb-2 block">
              Curated Listings
            </span>
            <h2 className="text-3xl font-bold text-primary">
              Latest Opportunities
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-secondary">
              {visibleCountText}
            </span>
            <div className="h-8 w-px bg-outline-variant/30"></div>
            <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-surface-tint transition-colors">
              Filter{" "}
              <span className="material-symbols-outlined text-lg">tune</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-secondary text-center">
              Loading jobs...
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 text-red-600 text-center">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-secondary text-center">
              No jobs found.
            </div>
          ) : (
            paginatedJobs.map((job) => {
              const primarySkill = job.skills[0] || job.category;
              const secondarySkill = job.skills[1] || job.location;
              const tertiarySkill = job.skills[2] || "Professional";
              const moreCount = Math.max(0, job.skills.length - 3);

              return (
                <div
                  key={job.job_id}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.job_id}`)}
                >
                  <div className="flex gap-6 mb-6">
                    <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                      {job.company_avatar_url ? (
                        <img
                          src={job.company_avatar_url}
                          alt={`${job.company_name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-extrabold text-blue-900">
                          {job.company_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-primary mb-1">
                            {job.title}
                          </h3>
                          <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                            {job.company_name}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-primary-container">
                          {job.salary_label}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                          {job.location}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                          {job.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <span>{primarySkill}</span>
                      <span className="text-slate-300">|</span>
                      <span>{secondarySkill}</span>
                      <span className="text-slate-300">|</span>
                      <span>{tertiarySkill}</span>
                      {moreCount > 0 && (
                        <span className="text-surface-tint ml-1">
                          +{moreCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-slate-400 uppercase">
                        {getPostedLabel(job.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
              <span className="text-sm font-bold pr-2">Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                      currentPage === page
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-secondary hover:bg-surface-container-high"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-bold pl-2">Next</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JobListing;
