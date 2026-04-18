import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToastNotifications from "../components/ToastNotifications";

type StoredUser = {
  user_id?: number;
  email?: string;
  full_name?: string | null;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type CityOption = {
  city_id: number;
  name: string;
};

type SkillOption = {
  skill_id: number;
  name: string;
};

type CandidateProfileData = {
  full_name: string;
  phone: string;
  email: string;
  city_id: number;
  skills: string[];
};

type CandidateResume = {
  resume_id: number;
  file_url: string;
  uploaded_at: string;
};

const emptyProfile: CandidateProfileData = {
  full_name: "",
  phone: "",
  email: "",
  city_id: 0,
  skills: [],
};

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CandidateProfileData>(emptyProfile);
  const [draftProfile, setDraftProfile] =
    useState<CandidateProfileData>(emptyProfile);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resumes, setResumes] = useState<CandidateResume[]>([]);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDeletingCv, setIsDeletingCv] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvSuccess, setCvSuccess] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  const isCandidate =
    parsedUser?.role?.role_id === 1 ||
    parsedUser?.role?.title?.toLowerCase() === "candidate";

  useEffect(() => {
    if (!userId || !isCandidate) {
      navigate("/candidate-login", { replace: true });
      return;
    }

    const fetchCandidateProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [profileResponse, citiesResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/candidate-profile/${userId}`),
          fetch("http://localhost:3000/api/candidate-profile/cities"),
        ]);

        const profileData = await profileResponse.json();
        const citiesData = await citiesResponse.json();

        if (!profileResponse.ok) {
          setError(profileData.message || "Failed to load candidate profile");
          return;
        }

        if (citiesResponse.ok) {
          setCities(citiesData.cities || []);
        }

        const normalizedProfile = {
          full_name: profileData.candidate?.full_name ?? "",
          phone: profileData.candidate?.phone ?? "",
          email: profileData.user?.email ?? parsedUser?.email ?? "",
          city_id: profileData.candidate?.city_id ?? 0,
          skills: Array.isArray(profileData.candidate?.skills)
            ? profileData.candidate.skills
            : [],
        };

        setResumes(
          Array.isArray(profileData.candidate?.resumes)
            ? profileData.candidate.resumes
            : [],
        );

        setProfile(normalizedProfile);
        setDraftProfile(normalizedProfile);
      } catch (err) {
        setError("An error occurred while loading profile.");
        console.error("Fetch candidate profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateProfile();
  }, [isCandidate, navigate, parsedUser?.email, userId]);

  useEffect(() => {
    const query = skillInput.trim();

    if (!query) {
      setSkillOptions([]);
      setIsLoadingSkills(false);
      return;
    }

    const controller = new AbortController();

    const loadSkills = async () => {
      setIsLoadingSkills(true);

      try {
        const response = await fetch(
          `http://localhost:3000/api/jobs/skills?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          },
        );
        const data = await response.json();

        if (!response.ok) {
          return;
        }

        setSkillOptions(Array.isArray(data.skills) ? data.skills : []);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") {
          return;
        }
        console.error("Search skills error:", loadError);
      } finally {
        setIsLoadingSkills(false);
      }
    };

    void loadSkills();

    return () => {
      controller.abort();
    };
  }, [skillInput]);

  const availableSkillOptions = useMemo(() => {
    const selected = new Set(
      draftProfile.skills.map((skill) => skill.toLowerCase()),
    );

    return skillOptions.filter(
      (option) => !selected.has(option.name.toLowerCase()),
    );
  }, [draftProfile.skills, skillOptions]);

  const handleDiscard = () => {
    setDraftProfile(profile);
    setSkillInput("");
    setSkillOptions([]);
    setError("");
    setSuccess("");
  };

  const handleAddSkill = () => {
    const nextSkill = skillInput.trim();

    if (!nextSkill) {
      return;
    }

    const isDuplicate = draftProfile.skills.some(
      (skill) => skill.toLowerCase() === nextSkill.toLowerCase(),
    );

    if (isDuplicate) {
      setSkillInput("");
      setSkillOptions([]);
      return;
    }

    setDraftProfile((current) => ({
      ...current,
      skills: [...current.skills, nextSkill],
    }));
    setSkillInput("");
    setSkillOptions([]);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setDraftProfile((current) => ({
      ...current,
      skills: current.skills.filter(
        (skill) => skill.toLowerCase() !== skillToRemove.toLowerCase(),
      ),
    }));
  };

  const handleSelectSkill = (skillName: string) => {
    const isDuplicate = draftProfile.skills.some(
      (skill) => skill.toLowerCase() === skillName.toLowerCase(),
    );

    if (!isDuplicate) {
      setDraftProfile((current) => ({
        ...current,
        skills: [...current.skills, skillName],
      }));
    }

    setSkillInput("");
    setSkillOptions([]);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      setError("Invalid user session");
      return;
    }

    if (!draftProfile.full_name.trim()) {
      setError("Full name cannot be empty");
      return;
    }

    if (!draftProfile.city_id) {
      setError("Please select your city");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/candidate-profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: draftProfile.full_name,
            phone: draftProfile.phone,
            city_id: draftProfile.city_id,
            skills: draftProfile.skills,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update candidate profile");
        return;
      }

      const updatedProfile = {
        full_name: data.candidate?.full_name ?? "",
        phone: data.candidate?.phone ?? "",
        email: data.user?.email ?? draftProfile.email,
        city_id: data.candidate?.city_id ?? draftProfile.city_id,
        skills: Array.isArray(data.candidate?.skills)
          ? data.candidate.skills
          : draftProfile.skills,
      };

      setProfile(updatedProfile);
      setDraftProfile(updatedProfile);
      setSkillInput("");
      setSkillOptions([]);
      setSuccess("Profile updated successfully.");

      const user = parsedUser || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
        }),
      );
    } catch (err) {
      setError("An error occurred while saving profile.");
      console.error("Update candidate profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getResumeFileName = (fileUrl: string) => {
    try {
      const parsed = new URL(fileUrl);
      const segments = parsed.pathname.split("/").filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || "resume");
    } catch {
      const segments = fileUrl.split("/").filter(Boolean);
      return decodeURIComponent(segments[segments.length - 1] || "resume");
    }
  };

  const getResumeUpdatedLabel = (uploadedAt: string) => {
    const timestamp = Date.parse(uploadedAt);
    if (Number.isNaN(timestamp)) {
      return "UPDATED RECENTLY";
    }

    const diffMs = Date.now() - timestamp;
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) {
      return "UPDATED TODAY";
    }

    if (diffDays === 1) {
      return "UPDATED 1 DAY AGO";
    }

    return `UPDATED ${diffDays} DAYS AGO`;
  };

  const handleUploadCv = async (fileToUpload?: File) => {
    const nextFile = fileToUpload ?? selectedCvFile;

    if (!userId) {
      setCvError("Invalid user session");
      return;
    }

    if (!nextFile) {
      setCvError("Please select a CV file before uploading");
      return;
    }

    setIsUploadingCv(true);
    setCvError("");
    setCvSuccess("");

    try {
      const formData = new FormData();
      formData.append("cv", nextFile);

      const response = await fetch(
        `http://localhost:3000/api/candidate-profile/${userId}/resume`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setCvError(data.message || "Failed to upload CV");
        return;
      }

      setSelectedCvFile(null);
      if (data.resume) {
        setResumes((current) => [data.resume, ...current]);
      }
      setCvSuccess("CV uploaded successfully.");
    } catch (uploadError) {
      setCvError("An error occurred while uploading CV.");
      console.error("Upload CV error:", uploadError);
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleDeleteCv = async (resumeId: number) => {
    if (!userId) {
      return;
    }

    setIsDeletingCv(true);
    setCvError("");
    setCvSuccess("");

    try {
      const response = await fetch(
        `http://localhost:3000/api/candidate-profile/${userId}/resume/${resumeId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setCvError(data.message || "Failed to delete CV");
        return;
      }

      setResumes((current) =>
        current.filter((item) => item.resume_id !== resumeId),
      );
      setCvSuccess("CV deleted successfully.");
    } catch (deleteError) {
      setCvError("An error occurred while deleting CV.");
      console.error("Delete CV error:", deleteError);
    } finally {
      setIsDeletingCv(false);
    }
  };

  const notifications = useMemo(
    () =>
      [
        error
          ? { id: "profile-error", message: error, variant: "error" as const }
          : null,
        success
          ? {
              id: "profile-success",
              message: success,
              variant: "success" as const,
            }
          : null,
        cvError
          ? { id: "cv-error", message: cvError, variant: "error" as const }
          : null,
        cvSuccess
          ? {
              id: "cv-success",
              message: cvSuccess,
              variant: "success" as const,
            }
          : null,
      ].filter(
        (
          item,
        ): item is {
          id: string;
          message: string;
          variant: "error" | "success";
        } => item !== null,
      ),
    [cvError, cvSuccess, error, success],
  );

  const handleDismissNotification = (id: string) => {
    switch (id) {
      case "profile-error":
        setError("");
        break;
      case "profile-success":
        setSuccess("");
        break;
      case "cv-error":
        setCvError("");
        break;
      case "cv-success":
        setCvSuccess("");
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-200 mx-auto px-6 py-12 pt-32">
        <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl">
          <p className="text-secondary">Loading candidate profile...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <ToastNotifications
        notifications={notifications}
        onDismiss={handleDismissNotification}
        autoHideMs={5000}
      />

      <main className="max-w-200 mx-auto px-6 py-12 pt-32">
        {/* Editorial Header  */}
        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-secondary uppercase mb-3 block">
            Account Settings
          </span>
          <h1 className="text-5xl font-extrabold tracking-tight text-primary leading-tight">
            My Profile
          </h1>
          <p className="text-secondary text-lg mt-4 max-w-2xl leading-relaxed">
            Keep your profile up to date so recruiters can evaluate your fit
            quickly.
          </p>
        </div>
        <form className="space-y-10" onSubmit={handleSaveProfile}>
          <section className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl">
            <div className="flex items-center gap-3 mb-10">
              <span className="material-symbols-outlined text-primary text-3xl">
                person
              </span>
              <h2 className="text-2xl font-bold text-primary">
                Personal Information
              </h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="Enter your full name"
                    type="text"
                    value={draftProfile.full_name}
                    onChange={(event) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        full_name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                    Phone Number
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={draftProfile.phone}
                    onChange={(event) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-secondary outline-none"
                    type="email"
                    value={draftProfile.email}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                    City
                  </label>
                  <select
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    value={draftProfile.city_id}
                    onChange={(event) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        city_id: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={0}>Select your city</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl">
            <div className="flex items-center gap-3 mb-10">
              <span className="material-symbols-outlined text-primary text-3xl">
                auto_awesome
              </span>
              <h2 className="text-2xl font-bold text-primary">Skills</h2>
            </div>

            <p className="text-secondary text-sm -mt-6 mb-5">
              Tell recruiters what you can do best.
            </p>

            <div className="relative mb-5">
              <input
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                placeholder="Search or type a skill and press Enter"
                type="text"
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSkill();
                  }
                }}
              />

              {skillInput.trim() && availableSkillOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant/20 rounded-xl shadow-lg z-50 py-2 max-h-60 overflow-y-auto">
                  {availableSkillOptions.map((option) => (
                    <button
                      key={option.skill_id}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                      type="button"
                      onClick={() => handleSelectSkill(option.name)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoadingSkills && skillInput.trim() && (
              <p className="text-xs text-secondary mb-4">Searching skills...</p>
            )}

            <div className="flex flex-wrap gap-3">
              {draftProfile.skills.length > 0 ? (
                draftProfile.skills.map((skill) => (
                  <div
                    key={skill}
                    className="group flex items-center gap-2 bg-secondary-fixed-dim/30 text-on-secondary-fixed px-5 py-2.5 rounded-full text-xs font-bold tracking-wide border border-transparent hover:border-outline-variant/20 transition-all cursor-default"
                  >
                    {skill}
                    <button
                      className="material-symbols-outlined text-sm cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity"
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      close
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary">No skills added yet.</p>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest p-8 lg:p-12 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">
                  upload_file
                </span>
              </div>
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                Resume / CV
              </h2>
            </div>

            <label className="block rounded-2xl border-2 border-dashed border-outline-variant/30 bg-white px-6 py-14 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-4xl">
                    cloud_upload
                  </span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-primary tracking-tight mb-2">
                  {isUploadingCv
                    ? "Uploading..."
                    : "Click to update your resume"}
                </p>
                <p className="text-secondary text-sm md:text-base font-medium">
                  Support for PDF and DOCX (Max 5MB)
                </p>
                {selectedCvFile && (
                  <p className="mt-3 text-sm font-semibold text-primary">
                    Selected: {selectedCvFile.name}
                  </p>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                disabled={isUploadingCv}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedCvFile(file);
                  setCvError("");
                  setCvSuccess("");
                  if (file) {
                    void handleUploadCv(file);
                  }
                }}
              />
            </label>

            <div className="mt-8 space-y-4">
              {resumes.length > 0 ? (
                resumes.map((item) => (
                  <div
                    key={item.resume_id}
                    className="rounded-xl bg-surface-container-low px-5 py-4 border border-outline-variant/15 flex items-center justify-between gap-4"
                  >
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex items-center gap-4 hover:opacity-85 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-md bg-surface-container-highest flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl">
                          description
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-bold text-primary truncate">
                          {getResumeFileName(item.file_url)}
                        </p>
                        <p className="text-[10px] md:text-xs font-bold text-secondary tracking-wider uppercase mt-0.5">
                          {getResumeUpdatedLabel(item.uploaded_at)}
                        </p>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteCv(item.resume_id)}
                      disabled={isDeletingCv}
                      className="w-9 h-9 rounded-md flex items-center justify-center text-secondary hover:text-error hover:bg-error-container/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete CV"
                      title="Delete CV"
                    >
                      <span className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-secondary px-1">
                  No CV uploaded yet.
                </p>
              )}
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase shadow-xl shadow-primary/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="flex-1 bg-surface-container-highest text-primary py-4 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-surface-container-high active:scale-95 transition-all"
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
};

export default CandidateProfile;
