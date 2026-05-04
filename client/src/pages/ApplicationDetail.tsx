import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

type LocationState = {
  application?: any;
  job?: { job_id?: number; title?: string; created_at?: string };
};

const ApplicationDetail = () => {
  const { jobId, applicationId } = useParams<{
    jobId: string;
    applicationId: string;
  }>();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const [application, setApplication] = useState<any>(
    state.application || null,
  );

  useEffect(() => {
    if (application) return;
    const fetchApplications = async () => {
      try {
        const resp = await fetch(`/api/jobs/${jobId}/applications`);
        const data = await resp.json();
        if (!resp.ok) return;
        // job data available in response but not needed here
        const found = (data.applications || []).find(
          (a: any) => String(a.application_id) === String(applicationId),
        );
        if (found) setApplication(found);
      } catch (e) {
        console.error("Failed to load application", e);
      }
    };

    fetchApplications();
  }, [application, applicationId, jobId]);

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen">
      <main className="pb-20 px-8 max-w-350 mx-auto pt-12">
        {/* Header Section  */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                {application?.status ? application.status : "In Review"}
              </span>
              <span className="text-on-surface-variant text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  calendar_today
                </span>
                {application?.created_at
                  ? `Applied ${new Date(application.created_at).toLocaleDateString()}`
                  : "Applied: N/A"}
              </span>
            </div>
            {((application && application.job && application.job.title) ||
              state.job?.title) && (
              <p className="text-sm text-secondary font-medium mb-1">
                Applied for: {application?.job?.title ?? state.job?.title}
              </p>
            )}
            <h1 className="text-5xl font-extrabold tracking-tighter text-primary mb-2">
              {application?.candidate?.full_name ?? "Candidate"}
            </h1>
          </div>
        </header>
        {/* Bento Grid Layout  */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area (Left/Center)  */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Info  */}
              <section className="bg-surface-container-low p-8 rounded-xl">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-6">
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-secondary">
                      mail
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Email Address
                      </p>
                      <p className="text-on-surface font-semibold">
                        {application?.candidate?.email ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-secondary">
                      call
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Phone Number
                      </p>
                      <p className="text-on-surface font-semibold">
                        {application?.candidate?.phone ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-secondary">
                      location_on
                    </span>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">
                        Location
                      </p>
                      <p className="text-on-surface font-semibold">
                        {application?.candidate?.location ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              {/* Professional Intro  */}
              <section className="bg-surface-container-low p-8 rounded-xl">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-6">
                  Cover letter
                </h4>
                <p className="text-on-surface leading-relaxed text-sm">
                  {application?.cover_letter
                    ? application.cover_letter
                    : "No cover letter provided."}
                </p>
              </section>
            </div>
            {/* CV Preview Card (Moved here)  */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant border-opacity-10 p-8">
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant mb-6">
                REsume
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-error text-2xl">
                      picture_as_pdf
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {application?.resume?.name ?? "Resume"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {application?.resume?.file_url ? "Uploaded CV" : "No CV"}
                    </p>
                  </div>
                </div>
                <button className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-lg">
                    download
                  </span>
                  Download
                </button>
              </div>
            </section>
          </div>
          {/* Sidebar Area (Right)  */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* AI Evaluation Card (Moved here)  */}
            <section className="bg-primary text-white p-8 rounded-xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined">
                      auto_awesome
                    </span>
                    AI Analysis
                  </h3>
                  <div className="w-16 h-16 rounded-full border-2 border-primary-fixed flex items-center justify-center shrink-0">
                    <span className="text-xl font-extrabold">
                      {application?.ai_evaluation?.score ?? "-"}
                      <span className="text-xs">%</span>
                    </span>
                  </div>
                </div>
                <p className="text-on-primary-container leading-relaxed text-sm">
                  {application?.ai_evaluation?.summary
                    ? application.ai_evaluation.summary
                    : "No AI summary available for this application."}
                </p>
              </div>
              <div className="relative space-y-6 pt-6 border-t border-white/10">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-primary-fixed mb-4">
                    Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(application?.ai_evaluation?.matching_skills || "")
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                      .map((skill: string) => (
                        <span
                          key={skill}
                          className="bg-primary-fixed/20 text-primary-fixed px-3 py-1 rounded-lg text-[10px] font-semibold border border-primary-fixed/20"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-error-container/70 mb-4">
                    Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(application?.ai_evaluation?.missing_skills || "")
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                      .map((skill: string) => (
                        <span
                          key={skill}
                          className="bg-error/20 text-error-container px-3 py-1 rounded-lg text-[10px] font-semibold border border-error/20 opacity-80"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationDetail;
