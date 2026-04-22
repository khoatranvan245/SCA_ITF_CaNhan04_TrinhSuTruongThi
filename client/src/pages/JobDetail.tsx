import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import JobApply from "./JobApply";
import type { JobApplyValues } from "./JobApply";
import ToastNotifications from "../components/ToastNotifications";

type JobDetailData = {
  job_id: number;
  title: string;
  company_id: number;
  company_name: string;
  company_avatar_url: string | null;
  company_category: string;
  company_address: string;
  category: string;
  location: string;
  created_at: string;
  expiration_date: string | null;
  salary_label: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  skills: string[];
};

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

const getCandidateUserId = (): number | null => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as StoredUser;
    const isCandidate =
      user?.role?.role_id === 1 ||
      user?.role?.role_id === 3 ||
      user?.role?.title?.toLowerCase() === "candidate";

    if (!isCandidate || typeof user.user_id !== "number") {
      return null;
    }

    return user.user_id;
  } catch {
    return null;
  }
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

const getExpireLabel = (expirationDate: string | null) => {
  if (!expirationDate) {
    return "No expiration";
  }

  const expiresAt = new Date(expirationDate);
  if (Number.isNaN(expiresAt.getTime())) {
    return "No expiration";
  }

  return expiresAt.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const JobDetail = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [job, setJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompanyLogoBroken, setIsCompanyLogoBroken] = useState(false);
  const [isApplyOverlayOpen, setIsApplyOverlayOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplyStatus, setIsCheckingApplyStatus] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState("");

  const handleApplyClick = () => {
    const candidateUserId = getCandidateUserId();

    if (!candidateUserId) {
      navigate("/candidate-login");
      return;
    }

    if (hasApplied) {
      return;
    }

    setIsApplyOverlayOpen(true);
  };

  const handleApplySubmit = async (values: JobApplyValues) => {
    if (!jobId) {
      throw new Error("Invalid job id");
    }

    const userId = getCandidateUserId();
    if (!userId) {
      navigate("/candidate-login");
      throw new Error("Please log in before applying");
    }

    const formData = new FormData();
    formData.append("user_id", String(userId));
    formData.append("introduction", values.introduction);

    if (values.selectedResumeId) {
      formData.append("selected_resume_id", String(values.selectedResumeId));
    }

    if (values.resumeFile) {
      formData.append("cv", values.resumeFile);
    }

    const response = await fetch(
      `http://localhost:3000/api/jobs/${jobId}/apply`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to submit application");
    }

    setHasApplied(true);
    setApplySuccessMessage("Application submitted successfully.");
  };

  const handleDismissNotification = (id: string) => {
    if (id === "apply-success") {
      setApplySuccessMessage("");
    }
  };

  useEffect(() => {
    const checkApplyStatus = async () => {
      if (!jobId) {
        setHasApplied(false);
        return;
      }

      const candidateUserId = getCandidateUserId();
      if (!candidateUserId) {
        setHasApplied(false);
        return;
      }

      setIsCheckingApplyStatus(true);

      try {
        const response = await fetch(
          `http://localhost:3000/api/jobs/${jobId}/apply-status/${candidateUserId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setHasApplied(false);
          return;
        }

        setHasApplied(Boolean(data.hasApplied));
      } catch {
        setHasApplied(false);
      } finally {
        setIsCheckingApplyStatus(false);
      }
    };

    void checkApplyStatus();
  }, [jobId]);

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
    <main className="max-w-7xl mx-auto py-12 md:py-20 px-8 w-full font-body text-on-surface">
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
          <ToastNotifications
            notifications={
              applySuccessMessage
                ? [
                    {
                      id: "apply-success",
                      message: applySuccessMessage,
                      variant: "success",
                    },
                  ]
                : []
            }
            onDismiss={handleDismissNotification}
            autoHideMs={4000}
          />

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

              <button
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleApplyClick}
                disabled={hasApplied || isCheckingApplyStatus}
              >
                {hasApplied ? "Already Applied" : "Apply for this position"}
              </button>
            </section>

            <aside className="space-y-8">
              <div className="bg-surface-container-lowest p-8 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] border border-outline-variant/15">
                <button
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg mb-6 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleApplyClick}
                  disabled={hasApplied || isCheckingApplyStatus}
                >
                  {hasApplied ? "Already Applied" : "Apply for this position"}
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
                      Expire date
                    </span>
                    <span className="text-primary font-bold">
                      {getExpireLabel(job.expiration_date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 border border-outline-variant/15">
                <h4 className="font-bold text-primary mb-6">Required Skills</h4>
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

              <div className="bg-white p-5 border border-outline-variant/20">
                <div className="flex items-center gap-4">
                  <Link
                    to={`/companies/${job.company_id}`}
                    className="h-20 w-20 rounded-lg border border-outline-variant/20 bg-white overflow-hidden flex items-center justify-center shrink-0"
                  >
                    {job.company_avatar_url && !isCompanyLogoBroken ? (
                      <img
                        src={job.company_avatar_url}
                        alt={`${job.company_name} logo`}
                        className="h-full w-full object-cover"
                        onError={() => setIsCompanyLogoBroken(true)}
                      />
                    ) : (
                      <span className="text-2xl font-extrabold text-blue-900">
                        {job.company_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>

                  <Link
                    to={`/companies/${job.company_id}`}
                    className="min-w-0 text-xl leading-tight font-extrabold tracking-tight text-primary hover:text-surface-tint transition-colors line-clamp-2"
                  >
                    {job.company_name}
                  </Link>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-on-surface-variant mb-4">
                    <span className="material-symbols-outlined text-lg leading-none text-outline">
                      inventory_2
                    </span>
                    <span className="font-medium text-secondary">Industry</span>
                    <span className="ml-5 font-semibold text-on-surface">
                      {job.company_category}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-lg leading-none text-outline">
                      location_on
                    </span>
                    <span className="font-medium text-secondary">Location</span>
                    <span className="ml-5 font-semibold text-on-surface">
                      {job.company_address}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <JobApply
            open={isApplyOverlayOpen}
            jobTitle={job.title}
            companyName={job.company_name}
            onClose={() => setIsApplyOverlayOpen(false)}
            onSubmit={handleApplySubmit}
          />
        </>
      )}
    </main>
  );
};

export default JobDetail;
