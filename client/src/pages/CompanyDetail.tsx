import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type CompanyOpenJob = {
  job_id: number;
  title: string;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
};

type CompanyDetailData = {
  company_id: number;
  name: string;
  description: string | null;
  website: string | null;
  category: string;
  location: string;
  open_roles_count: number;
  since_year: number;
  jobs: CompanyOpenJob[];
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

const formatSalaryLabel = (
  salaryMin: number | null,
  salaryMax: number | null,
): string => {
  if (salaryMin !== null && salaryMax !== null) {
    return `${salaryMin.toLocaleString("vi-VN")} - ${salaryMax.toLocaleString("vi-VN")} VND`;
  }

  if (salaryMax !== null) {
    return `Up to ${salaryMax.toLocaleString("vi-VN")} VND`;
  }

  if (salaryMin !== null) {
    return `From ${salaryMin.toLocaleString("vi-VN")} VND`;
  }

  return "Salary negotiable";
};

const getPostedLabel = (createdAt: string) => {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return "Posted recently";
  }

  const diffMs = Date.now() - createdTime;
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
};

const CompanyDetail = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const jobsPerPage = 5;

  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobsPage, setJobsPage] = useState(1);

  useEffect(() => {
    const fetchCompanyDetail = async () => {
      if (!companyId) {
        setError("Invalid company id");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3000/api/company-profile/detail/${companyId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load company detail");
          return;
        }

        setCompany(data.company || null);
      } catch (loadError) {
        console.error("Load company detail error:", loadError);
        setError("An error occurred while loading company detail.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetail();
  }, [companyId]);

  const descriptionHtml = useMemo(
    () => sanitizeHtml(company?.description),
    [company?.description],
  );

  const descriptionContentClassName =
    "text-lg leading-8 text-on-surface-variant [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-primary [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mb-4 [&_h3]:mt-7 [&_p]:mb-4 [&_p]:text-lg [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol_li]:mb-2 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic";

  const jobsTotalPages = Math.max(
    1,
    Math.ceil((company?.jobs.length ?? 0) / jobsPerPage),
  );

  const paginatedJobs = useMemo(() => {
    if (!company) {
      return [] as CompanyOpenJob[];
    }

    const startIndex = (jobsPage - 1) * jobsPerPage;
    return company.jobs.slice(startIndex, startIndex + jobsPerPage);
  }, [company, jobsPage]);

  useEffect(() => {
    setJobsPage(1);
  }, [companyId]);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto py-12 md:py-20 px-8 grow w-full">
        {isLoading ? (
          <div className="bg-white p-8 rounded-xl border border-outline-variant/15 text-secondary text-center">
            Loading company details...
          </div>
        ) : error || !company ? (
          <div className="bg-white p-8 rounded-xl border border-red-200 text-center">
            <p className="text-red-600 mb-4">{error || "Company not found."}</p>
            <button
              onClick={() => navigate("/company-listing")}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              Back to Company Listing
            </button>
          </div>
        ) : (
          <>
            <header className="mb-16 max-w-4xl">
              <div className="inline-flex items-center px-3 py-1 bg-secondary-fixed-dim text-on-secondary-fixed rounded-full text-[0.7rem] font-bold tracking-widest uppercase mb-6">
                {company.category}
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight leading-tight mb-4">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-secondary font-medium text-lg">
                <span>{company.location}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30"></span>
                <span className="text-primary font-bold">
                  {company.open_roles_count} Open Roles
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/30"></span>
                <span>Since {company.since_year}</span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start">
              <section className="space-y-12">
                <div className="prose prose-slate max-w-none">
                  <h2 className="text-2xl font-bold text-primary mb-6">
                    About Us
                  </h2>
                  {descriptionHtml ? (
                    <div
                      className={descriptionContentClassName}
                      dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-on-surface-variant">
                      No company description provided.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-primary">
                      Open Positions
                    </h2>
                    <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-primary tracking-widest uppercase">
                      {company.open_roles_count} Available
                    </span>
                  </div>

                  {company.jobs.length === 0 ? (
                    <div className="bg-surface-container-lowest p-6 border border-outline-variant/15 text-secondary">
                      No open positions at the moment.
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-6">
                      <div className="space-y-4">
                        {paginatedJobs.map((job) => (
                          <div
                            key={job.job_id}
                            className="bg-white p-6 border border-outline-variant/15 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all"
                          >
                            <div>
                              <h3 className="text-xl font-bold text-primary mb-3">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap gap-4 text-sm text-secondary font-medium">
                                <span>
                                  {formatSalaryLabel(
                                    job.salary_min,
                                    job.salary_max,
                                  )}
                                </span>
                                <span>{getPostedLabel(job.created_at)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/jobs/${job.job_id}`)}
                              className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                            >
                              View Job
                            </button>
                          </div>
                        ))}
                      </div>

                      {jobsTotalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                          <button
                            className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() =>
                              setJobsPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={jobsPage === 1}
                          >
                            <span className="material-symbols-outlined">
                              chevron_left
                            </span>
                            <span className="text-sm font-bold pr-2">
                              Previous
                            </span>
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: jobsTotalPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <button
                                key={page}
                                onClick={() => setJobsPage(page)}
                                className={`h-10 w-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                                  jobsPage === page
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "text-secondary hover:bg-surface-container-high"
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          <button
                            className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() =>
                              setJobsPage((prev) =>
                                Math.min(jobsTotalPages, prev + 1),
                              )
                            }
                            disabled={jobsPage === jobsTotalPages}
                          >
                            <span className="text-sm font-bold pl-2">Next</span>
                            <span className="material-symbols-outlined">
                              chevron_right
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-8 lg:sticky lg:top-24">
                <div className="bg-surface-container-lowest p-8 border border-outline-variant/15 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)]">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-[0.15em] mb-6">
                    Company Essentials
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Category
                      </span>
                      <span className="text-primary font-bold">
                        {company.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Location
                      </span>
                      <span className="text-primary font-bold">
                        {company.location}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Founded
                      </span>
                      <span className="text-primary font-bold">
                        {company.since_year}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                      <span className="text-secondary text-sm font-medium">
                        Website
                      </span>
                      {company.website ? (
                        <a
                          className="text-primary font-bold hover:underline"
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-secondary font-medium">N/A</span>
                      )}
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

export default CompanyDetail;
