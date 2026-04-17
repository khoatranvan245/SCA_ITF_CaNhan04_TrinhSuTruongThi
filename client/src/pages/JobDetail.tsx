import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type JobDetailData = {
  job_id: number;
  title: string;
  company_id: number;
  company_name: string;
  company_avatar_url: string | null;
  company_category: string;
  category: string;
  location: string;
  created_at: string;
  salary_label: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  skills: string[];
};

const sanitizeHtml = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(value, "text/html");

  const unsafeNodes = document.querySelectorAll(
    "script, style, iframe, object, embed, link, meta",
  );
  unsafeNodes.forEach((node) => node.remove());

  const allElements = document.body.querySelectorAll("*");
  allElements.forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.toLowerCase();

      if (
        attributeName.startsWith("on") ||
        (attributeName === "href" &&
          attributeValue.startsWith("javascript:")) ||
        (attributeName === "src" && attributeValue.startsWith("javascript:"))
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return document.body.innerHTML;
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
  const [isCompanyLogoBroken, setIsCompanyLogoBroken] = useState(false);

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

  useEffect(() => {
    setIsCompanyLogoBroken(false);
  }, [job?.company_avatar_url, job?.company_id]);

  const descriptionHtml = useMemo(
    () => sanitizeHtml(job?.description),
    [job?.description],
  );

  const requirementsHtml = useMemo(
    () => sanitizeHtml(job?.requirements),
    [job?.requirements],
  );

  const benefitsHtml = useMemo(
    () => sanitizeHtml(job?.benefits),
    [job?.benefits],
  );

  const descriptionContentClassName =
    "mb-8 text-lg leading-8 text-on-surface-variant [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:tracking-normal [&_h1]:text-secondary [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-normal [&_h2]:text-secondary [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-secondary [&_h3]:mb-4 [&_h3]:mt-7 [&_p]:mb-4 [&_p]:text-lg [&_p]:leading-8 [&_p]:text-on-surface-variant [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:marker:text-primary [&_ul_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:marker:text-primary [&_ol_li]:mb-2 [&_li]:mb-2 [&_a]:text-primary [&_a]:font-semibold [&_a]:underline [&_a:hover]:text-surface-tint [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-surface-container-low [&_code]:text-primary [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-surface-container-low [&_pre]:overflow-x-auto";

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
                <div className="inline-flex items-center gap-3">
                  <Link
                    to={`/companies/${job.company_id}`}
                    className="h-10 w-10 rounded-lg border border-outline-variant/20 bg-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer"
                  >
                    {job.company_avatar_url && !isCompanyLogoBroken ? (
                      <img
                        src={job.company_avatar_url}
                        alt={`${job.company_name} logo`}
                        className="h-full w-full object-cover"
                        onError={() => setIsCompanyLogoBroken(true)}
                      />
                    ) : (
                      <span className="text-base font-extrabold text-blue-900">
                        {job.company_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={`/companies/${job.company_id}`}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {job.company_name}
                  </Link>
                </div>
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
                  {descriptionHtml ? (
                    <div
                      className={descriptionContentClassName}
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
                      No description provided.
                    </p>
                  )}

                  <h3 className="text-xl font-bold text-primary mb-6 mt-12">
                    What We Are Looking For
                  </h3>
                  {requirementsHtml ? (
                    <div
                      className={descriptionContentClassName}
                      dangerouslySetInnerHTML={{ __html: requirementsHtml }}
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
                      No requirements listed.
                    </p>
                  )}
                </div>

                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-bold text-primary mb-6 mt-12">
                    Benefits
                  </h3>
                  {benefitsHtml ? (
                    <div
                      className={descriptionContentClassName}
                      dangerouslySetInnerHTML={{ __html: benefitsHtml }}
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-on-surface-variant mb-8">
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
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/companies/${job.company_id}`}
                      className="h-12 w-12 rounded-lg border border-outline-variant/20 bg-white shadow-sm overflow-hidden flex items-center justify-center shrink-0"
                    >
                      {job.company_avatar_url && !isCompanyLogoBroken ? (
                        <img
                          src={job.company_avatar_url}
                          alt={`${job.company_name} logo`}
                          className="h-full w-full object-cover"
                          onError={() => setIsCompanyLogoBroken(true)}
                        />
                      ) : (
                        <span className="text-lg font-extrabold text-blue-900">
                          {job.company_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </Link>
                    <div>
                      <Link
                        to={`/companies/${job.company_id}`}
                        className="font-bold text-primary hover:text-surface-tint transition-colors"
                      >
                        {job.company_name}
                      </Link>
                      <p className="text-xs text-secondary font-medium uppercase tracking-wider mt-1">
                        {job.company_category}
                      </p>
                    </div>
                  </div>
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
