import { useEffect, useState } from "react";

export type JobApplyValues = {
  introduction: string;
  selectedResumeId: number | null;
  resumeFile: File | null;
};

type CandidateResume = {
  resume_id: number;
  name: string;
  file_url: string;
  uploaded_at: string;
};

type StoredUser = {
  user_id?: number;
};

type ResumeSelectionMode = "loading" | "saved" | "upload";

type JobApplyProps = {
  open: boolean;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onSubmit?: (values: JobApplyValues) => void | Promise<void>;
};

const emptyValues: JobApplyValues = {
  introduction: "",
  selectedResumeId: null,
  resumeFile: null,
};

const getResumeUploadedLabel = (uploadedAt: string) => {
  const uploadedTime = Date.parse(uploadedAt);
  if (Number.isNaN(uploadedTime)) {
    return "Uploaded recently";
  }

  return new Date(uploadedTime).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const JobApply = ({
  open,
  jobTitle,
  companyName,
  onClose,
  onSubmit,
}: JobApplyProps) => {
  const [values, setValues] = useState<JobApplyValues>(emptyValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [resumeMode, setResumeMode] = useState<ResumeSelectionMode>("loading");
  const [savedResumes, setSavedResumes] = useState<CandidateResume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [resumeLoadError, setResumeLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      setValues(emptyValues);
      setIsSubmitting(false);
      setIsOverlayVisible(false);
      setResumeMode("loading");
      setSavedResumes([]);
      setIsLoadingResumes(false);
      setResumeLoadError("");
      setSubmitError("");

      const animationFrameId = window.requestAnimationFrame(() => {
        setIsOverlayVisible(true);
      });

      return () => window.cancelAnimationFrame(animationFrameId);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      setResumeMode("upload");
      setIsLoadingResumes(false);
      return;
    }

    let userId: number | null = null;

    try {
      const user = JSON.parse(rawUser) as StoredUser;
      userId =
        typeof user.user_id === "number" && user.user_id > 0
          ? user.user_id
          : null;
    } catch {
      userId = null;
    }

    if (!userId) {
      setResumeMode("upload");
      setIsLoadingResumes(false);
      return;
    }

    const controller = new AbortController();

    const loadSavedResumes = async () => {
      setIsLoadingResumes(true);
      setResumeLoadError("");

      try {
        const response = await fetch(
          `http://localhost:3000/api/candidate-profile/${userId}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          setResumeLoadError(data.message || "Failed to load saved CVs");
          return;
        }

        const resumes = Array.isArray(data.candidate?.resumes)
          ? (data.candidate.resumes as CandidateResume[])
          : [];

        setSavedResumes(resumes);
        setResumeMode("upload");
        setValues((current) => ({
          ...current,
          selectedResumeId: null,
          resumeFile: null,
        }));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setResumeLoadError("Unable to load saved CVs");
      } finally {
        setIsLoadingResumes(false);
      }
    };

    void loadSavedResumes();

    return () => controller.abort();
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit application",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResumeSelected =
    resumeMode === "saved"
      ? values.selectedResumeId !== null
      : values.resumeFile !== null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close job apply overlay"
        className={`absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity duration-200 ${
          isOverlayVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl rounded-2xl bg-surface-container-lowest shadow-[0_30px_55px_-20px_rgba(0,0,0,0.35)] border border-outline-variant/20 transition-all duration-200 ease-out ${
          isOverlayVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-1 scale-[0.98]"
        }`}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/15">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-secondary mb-1">
              Application Form
            </p>
            <h2 className="text-2xl font-extrabold text-primary leading-tight">
              Apply for {jobTitle}
            </h2>
            <p className="text-sm text-secondary mt-1">
              Submit your CV and quick introduction to {companyName}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-outline hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-secondary px-1">
              CV / Resume
            </label>
            {savedResumes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResumeMode("upload");
                    setValues((current) => ({
                      ...current,
                      selectedResumeId: null,
                    }));
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
                    resumeMode === "upload"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-secondary hover:bg-surface-container"
                  }`}
                >
                  Upload new CV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResumeMode("saved");
                    setValues((current) => ({ ...current, resumeFile: null }));
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
                    resumeMode === "saved"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-secondary hover:bg-surface-container"
                  }`}
                >
                  Use saved CV
                </button>
              </div>
            )}

            {isLoadingResumes || resumeMode === "loading" ? (
              <p className="text-xs text-secondary px-1">
                Loading saved CVs...
              </p>
            ) : null}

            {!isLoadingResumes && resumeLoadError && (
              <p className="text-xs text-error px-1">{resumeLoadError}</p>
            )}

            {!isLoadingResumes && resumeMode === "saved" && savedResumes.length > 0 && (
              <div className="space-y-2">
                {savedResumes.map((resume) => (
                  <button
                    key={resume.resume_id}
                    type="button"
                    onClick={() =>
                      setValues((current) => ({
                        ...current,
                        selectedResumeId: resume.resume_id,
                      }))
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      values.selectedResumeId === resume.resume_id
                        ? "border-black bg-white"
                        : "border-gray-300 bg-white hover:border-black"
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary truncate">
                      {resume.name}
                    </p>
                    <p className="text-xs text-secondary mt-0.5">
                      Uploaded {getResumeUploadedLabel(resume.uploaded_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {resumeMode === "upload" && (
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 transition-colors hover:border-black focus-within:border-black">
                <span className="text-xs text-on-surface-variant truncate pr-3">
                  {values.resumeFile
                    ? values.resumeFile.name
                    : "Choose a file (PDF, DOC, DOCX)"}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Browse
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setValues((current) => ({
                      ...current,
                      selectedResumeId: null,
                      resumeFile: nextFile,
                    }));
                  }}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-secondary px-1">
              Quick Introduction
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black focus:ring-0"
              rows={4}
              value={values.introduction}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  introduction: event.target.value,
                }))
              }
              placeholder="Tell the recruiter why you are a great fit"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-secondary hover:bg-surface-container transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-all disabled:opacity-60"
              disabled={isSubmitting || !isResumeSelected}
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApply;
