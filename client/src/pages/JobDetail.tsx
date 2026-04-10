import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type JobDetailData = {
  job_id: number;
  title: string;
  company_name: string;
  category: string;
  location: string;
  created_at: string;
  salary_label: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  skills: string[];
};

const splitTextToList = (value: string | null | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|\.|;/)
    .map((item) => item.trim())
    .filter(Boolean);
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

const JobDetail = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [job, setJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError("Invalid job id");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load job detail");
          return;
        }

        setJob(data.job || null);
      } catch (loadError) {
        console.error("Load job detail error:", loadError);
        setError("An error occurred while loading job detail.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const requirements = useMemo(
    () => splitTextToList(job?.requirements),
    [job?.requirements],
  );

  const benefits = useMemo(
    () => splitTextToList(job?.benefits),
    [job?.benefits],
  );

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto py-12 md:py-20 px-8 grow w-full">
        {isLoading ? (
          <div className="bg-white p-8 rounded-xl border border-outline-variant/15 text-secondary text-center">
            Loading job details...
          </div>
        ) : error || !job ? (
          <div className="bg-white p-8 rounded-xl border border-red-200 text-center">
            <p className="text-red-600 mb-4">{error || "Job not found."}</p>
            <button
              onClick={() => navigate("/job-listing")}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              Back to Job Listing
            </button>
          </div>
        ) : (
          <>
            <header className="mb-16 max-w-4xl">
              <div className="inline-flex items-center px-3 py-1 bg-secondary-fixed-dim text-on-secondary-fixed rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-6">
                {job.category}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight leading-tight mb-4">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-secondary font-medium text-lg">
                <span>{job.company_name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30"></span>
                <span>{job.location}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30"></span>
                <span className="text-primary font-bold">
                  {job.salary_label}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30"></span>
                <span>{getPostedLabel(job.created_at)}</span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start prose prose-slate max-w-none">
              <section className="space-y-12">
                <div className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-bold text-primary mb-6">
                    About the Role
                  </h2>
                  <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
                    {job.description || "No description provided."}
                  </p>

                  <h3 className="text-xl font-bold text-primary mb-6 mt-12">
                    What We Are Looking For
                  </h3>
                  {requirements.length > 0 ? (
                    <ul className="space-y-4 text-on-surface-variant list-none p-0">
                      {requirements.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex gap-4">
                          <span
                            className="material-symbols-outlined text-primary-container shrink-0"
                            style={{ fontVariationSettings: "FILL 1" }}
                          >
                            check_circle
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-on-surface-variant">
                      No requirements listed.
                    </p>
                  )}
                </div>

                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-bold text-primary mb-6 mt-12">
                    Benefits
                  </h3>
                  {benefits.length > 0 ? (
                    <ul className="space-y-4 text-on-surface-variant list-none p-0">
                      {benefits.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex gap-4">
                          <span
                            className="material-symbols-outlined text-primary-container shrink-0"
                            style={{ fontVariationSettings: "FILL 1" }}
                          >
                            check_circle
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-on-surface-variant">
                      No benefits listed.
                    </p>
                  )}
                </div>
              </section>

              <aside className="space-y-8 lg:sticky lg:top-8">
                <div className="bg-surface-container-lowest p-8 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] border border-outline-variant/15">
                  <button className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg mb-6 hover:opacity-90 transition-all">
                    Apply for this position
                  </button>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Salary
                      </span>
                      <span className="text-primary font-bold">
                        {job.salary_label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Location
                      </span>
                      <span className="text-primary font-bold">
                        {job.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Category
                      </span>
                      <span className="text-primary font-bold">
                        {job.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 border border-outline-variant/15">
                  <h4 className="font-bold text-primary mb-6">
                    Required Skills
                  </h4>
                  {job.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-surface-container-low text-primary text-sm font-medium rounded-lg border border-outline-variant/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      No skills listed.
                    </p>
                  )}
                </div>

                <div className="bg-white p-8 border border-outline-variant/15">
                  <h4 className="font-bold text-primary">{job.company_name}</h4>
                  <p className="text-xs text-secondary font-medium uppercase tracking-wider mt-1">
                    {job.category}
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JobDetail;
