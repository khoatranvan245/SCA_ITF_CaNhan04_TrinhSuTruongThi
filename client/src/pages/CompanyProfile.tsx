import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Uppy, { type UppyFile } from "@uppy/core";
import RichTextEditor from "../components/RichTextEditor";
import ToastNotifications from "../components/ToastNotifications";

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type CompanyProfileData = {
  name: string;
  category_id: number | null;
  city_id: number | null;
  address: string;
  website: string;
  description: string;
  avatar_url: string | null;
};

type CategoryOption = {
  company_category_id: number;
  title: string;
};

type CityOption = {
  city_id: number;
  name: string;
};

type EditableSection =
  | "name"
  | "industry"
  | "city"
  | "address"
  | "website"
  | "description"
  | null;

const emptyProfile: CompanyProfileData = {
  name: "",
  category_id: null,
  city_id: null,
  address: "",
  website: "",
  description: "",
  avatar_url: null,
};

const fieldContainerClass =
  "space-y-2 relative cursor-pointer section-editable pb-4 transition-all";

const fieldContainerActiveClass = "";

const fieldInputClass =
  "w-full bg-surface-container-lowest border rounded-xl px-4 py-3 outline-none transition-all";

const getFieldControlClass = (
  editingSection: EditableSection,
  section: Exclude<EditableSection, null>,
  extraClass = "",
) =>
  `${fieldInputClass} ${
    editingSection === section ? "border-primary" : "border-outline-variant/15"
  } ${extraClass}`;

const normalizeEditorHtmlForStorage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "<p><br></p>") {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");

  // Quill can output lists as <ol><li data-list="bullet">...</li></ol>.
  // Convert pure bullet groups to semantic <ul> so DB stores expected markup.
  doc.querySelectorAll("ol").forEach((ol) => {
    const listItems = Array.from(ol.children).filter(
      (node): node is HTMLLIElement => node.tagName.toLowerCase() === "li",
    );

    if (listItems.length === 0) {
      return;
    }

    const isPureBulletList = listItems.every(
      (item) => item.getAttribute("data-list") === "bullet",
    );

    listItems.forEach((item) => {
      const dataList = item.getAttribute("data-list");
      if (dataList === "bullet" || dataList === "ordered") {
        item.removeAttribute("data-list");
      }
    });

    if (isPureBulletList) {
      const ul = doc.createElement("ul");
      ul.innerHTML = ol.innerHTML;
      ol.replaceWith(ul);
    }
  });

  return doc.body.innerHTML.trim();
};

const CompanyProfile = () => {
  const navigate = useNavigate();
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const persistedAvatarUrlRef = useRef<string>("");
  const [profile, setProfile] = useState<CompanyProfileData>(emptyProfile);
  const [draftProfile, setDraftProfile] =
    useState<CompanyProfileData>(emptyProfile);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const [avatarFileName, setAvatarFileName] = useState<string>("");
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);

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

  const uppy = useMemo(
    () =>
      new Uppy({
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ["image/*"],
          maxFileSize: 5 * 1024 * 1024,
        },
      }),
    [],
  );

  useEffect(() => {
    if (!userId || !isRecruiter) {
      navigate("/recruiter-login", { replace: true });
      return;
    }

    const fetchCompanyProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [profileResponse, categoriesResponse, citiesResponse] =
          await Promise.all([
            fetch(`http://localhost:3000/api/company-profile/${userId}`),
            fetch("http://localhost:3000/api/company-profile/categories"),
            fetch("http://localhost:3000/api/company-profile/cities"),
          ]);

        const data = await profileResponse.json();
        const categoriesData = await categoriesResponse.json();
        const citiesData = await citiesResponse.json();

        if (!profileResponse.ok) {
          setError(data.message || "Failed to load company profile");
          return;
        }

        if (categoriesResponse.ok) {
          setCategories(categoriesData.categories || []);
        }

        if (citiesResponse.ok) {
          setCities(citiesData.cities || []);
        }

        const normalizedProfile = {
          name: data.company?.name ?? "",
          category_id: data.company?.category_id ?? null,
          city_id: data.company?.city_id ?? null,
          address: data.company?.address ?? "",
          website: data.company?.website ?? "",
          description: data.company?.description ?? "",
          avatar_url: data.company?.avatar_url ?? null,
        };

        setProfile(normalizedProfile);
        setDraftProfile(normalizedProfile);
        setAvatarPreviewUrl(normalizedProfile.avatar_url ?? "");
        setAvatarFileName("");

        const rawCompany = localStorage.getItem("company");
        const parsedCompany = rawCompany ? JSON.parse(rawCompany) : {};
        localStorage.setItem(
          "company",
          JSON.stringify({ ...parsedCompany, ...data.company }),
        );
      } catch (err) {
        setError("An error occurred while loading profile.");
        console.error("Fetch company profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [isRecruiter, navigate, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!editingSection) {
        return;
      }

      const targetNode = event.target as Node;
      if (
        formContainerRef.current &&
        !formContainerRef.current.contains(targetNode)
      ) {
        setEditingSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingSection]);

  useEffect(() => {
    persistedAvatarUrlRef.current = profile.avatar_url ?? "";

    if (uppy.getFiles().length === 0) {
      setAvatarPreviewUrl(persistedAvatarUrlRef.current);
    }
  }, [profile.avatar_url, uppy]);

  useEffect(() => {
    const clearAvatarPreview = () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      setAvatarPreviewUrl(persistedAvatarUrlRef.current);
      setAvatarFileName("");
    };

    const handleFileAdded = (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    ) => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }

      if (!(file.data instanceof Blob)) {
        return;
      }

      const nextPreviewUrl = URL.createObjectURL(file.data);
      avatarObjectUrlRef.current = nextPreviewUrl;
      setAvatarPreviewUrl(nextPreviewUrl);
      setAvatarFileName(file.name);
    };

    const handleFileRemoved = () => {
      if (uppy.getFiles().length === 0) {
        clearAvatarPreview();
      }
    };

    uppy.on("file-added", handleFileAdded);
    uppy.on("file-removed", handleFileRemoved);
    uppy.on("cancel-all", clearAvatarPreview);

    return () => {
      uppy.off("file-added", handleFileAdded);
      uppy.off("file-removed", handleFileRemoved);
      uppy.off("cancel-all", clearAvatarPreview);
      clearAvatarPreview();
      uppy.destroy();
    };
  }, [uppy]);

  const handleSectionClick = (section: EditableSection) => {
    setSuccess("");
    setEditingSection(section);
  };

  const handleOpenAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) {
      return;
    }

    setError("");

    uppy.getFiles().forEach((file) => {
      uppy.removeFile(file.id);
    });

    try {
      uppy.addFile({
        name: nextFile.name,
        type: nextFile.type,
        data: nextFile,
        source: "Local",
        isRemote: false,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to select avatar file.",
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleDiscard = () => {
    uppy.getFiles().forEach((file) => {
      uppy.removeFile(file.id);
    });
    setDraftProfile(profile);
    setEditingSection(null);
    setError("");
    setSuccess("");
    setAvatarPreviewUrl(profile.avatar_url ?? "");
    setAvatarFileName("");
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      setError("Invalid user session");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const normalizedProfile = {
        ...draftProfile,
        description: normalizeEditorHtmlForStorage(draftProfile.description),
      };

      const formData = new FormData();
      formData.append("profile", JSON.stringify(normalizedProfile));

      const avatarFile = uppy.getFiles()[0]?.data;
      if (avatarFile instanceof File) {
        formData.append("avatar", avatarFile, avatarFile.name);
      }

      const response = await fetch(
        `http://localhost:3000/api/company-profile/${userId}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update company profile");
        return;
      }

      const updatedProfile = {
        name: data.company?.name ?? "",
        category_id: data.company?.category_id ?? null,
        city_id: data.company?.city_id ?? null,
        address: data.company?.address ?? "",
        website: data.company?.website ?? "",
        description: data.company?.description ?? "",
        avatar_url: data.company?.avatar_url ?? null,
      };

      setProfile(updatedProfile);
      setDraftProfile(updatedProfile);
      setEditingSection(null);
      setSuccess("Profile updated successfully.");
      setAvatarPreviewUrl(updatedProfile.avatar_url ?? "");
      setAvatarFileName("");

      uppy.getFiles().forEach((file) => {
        uppy.removeFile(file.id);
      });

      const rawCompany = localStorage.getItem("company");
      const parsedCompany = rawCompany ? JSON.parse(rawCompany) : {};
      localStorage.setItem(
        "company",
        JSON.stringify({ ...parsedCompany, ...data.company }),
      );
    } catch (err) {
      setError("An error occurred while saving profile.");
      console.error("Update company profile error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const notifications = useMemo(
    () =>
      [
        error
          ? {
              id: "company-profile-error",
              message: error,
              variant: "error" as const,
            }
          : null,
        success
          ? {
              id: "company-profile-success",
              message: success,
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
    [error, success],
  );

  const handleDismissNotification = useCallback((id: string) => {
    if (id === "company-profile-error") {
      setError("");
      return;
    }

    if (id === "company-profile-success") {
      setSuccess("");
    }
  }, []);

  if (isLoading) {
    return (
      <main className="pt-32 pb-24 px-6 text-on-surface">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-container-lowest rounded-xl p-10 border border-outline-variant/15">
            Loading company profile...
          </div>
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

      <main className="pt-32 pb-24 px-6 text-on-surface antialiased">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-[3.5rem] font-bold tracking-tight text-primary mb-2">
              Company Management
            </h1>
            <p className="text-secondary body-lg">
              Curate your organization's digital identity to attract top-tier
              talent.
            </p>
          </div>

          <div
            ref={formContainerRef}
            className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] border border-outline-variant/15"
          >
            <form className="space-y-10" onSubmit={handleSaveProfile}>
              <div className="pb-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleAvatarInputChange}
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={handleOpenAvatarPicker}
                    className="w-24 h-24 rounded-lg bg-slate-300/70 flex items-center justify-center border border-slate-300 hover:bg-slate-300 transition-colors overflow-hidden cursor-pointer"
                  >
                    {avatarPreviewUrl ? (
                      <img
                        src={avatarPreviewUrl}
                        alt="Company logo preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="w-8 h-8 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="3" y="11" width="8" height="9" />
                        <rect x="13" y="7" width="8" height="13" />
                        <path d="M6 14h2M6 17h2M9 14h2M9 17h2M16 10h2M16 13h2M16 16h2" />
                      </svg>
                    )}
                  </button>

                  <div className="space-y-1.5">
                    <p className="text-lg font-semibold text-slate-900 leading-tight">
                      Company Logo
                    </p>
                    <p className="uppercase tracking-[0.14em] text-[11px] text-slate-500">
                      Recommended: 400x400px .png, .jpg or .svg
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAvatarPicker}
                      className="text-sm font-semibold text-slate-900 hover:text-primary transition-colors break-all text-left cursor-pointer"
                    >
                      {avatarFileName || "Choose a logo file"}
                    </button>
                    {avatarFileName && (
                      <button
                        type="button"
                        onClick={() => uppy.cancelAll()}
                        className="block text-xs text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "name" ? fieldContainerActiveClass : ""
                }`}
                onClick={() => handleSectionClick("name")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    Name
                  </label>
                </div>
                <input
                  className={getFieldControlClass(editingSection, "name")}
                  value={draftProfile.name}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={() => setEditingSection("name")}
                  onChange={(e) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Company name"
                />
              </div>

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "industry" ? fieldContainerActiveClass : ""
                }`}
                onClick={() => handleSectionClick("industry")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    Industry
                  </label>
                </div>
                <select
                  className={getFieldControlClass(editingSection, "industry")}
                  value={draftProfile.category_id ?? ""}
                  onChange={(e) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      category_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  onClick={(e) => e.stopPropagation()}
                  onFocus={() => setEditingSection("industry")}
                >
                  <option value="">Select industry</option>
                  {categories.map((category) => (
                    <option
                      key={category.company_category_id}
                      value={category.company_category_id}
                    >
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div
                  className={`${fieldContainerClass} md:w-[30%] w-full ${
                    editingSection === "city" ? fieldContainerActiveClass : ""
                  }`}
                  onClick={() => handleSectionClick("city")}
                >
                  <div className="flex justify-between items-start">
                    <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                      City
                    </label>
                  </div>
                  <select
                    className={getFieldControlClass(editingSection, "city")}
                    value={draftProfile.city_id ?? ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        city_id: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setEditingSection("city")}
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`${fieldContainerClass} md:w-[70%] w-full ${
                    editingSection === "address"
                      ? fieldContainerActiveClass
                      : ""
                  }`}
                  onClick={() => handleSectionClick("address")}
                >
                  <div className="flex justify-between items-start">
                    <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                      Address
                    </label>
                  </div>
                  <input
                    className={getFieldControlClass(editingSection, "address")}
                    value={draftProfile.address}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setEditingSection("address")}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Street, ward, district"
                  />
                </div>
              </div>

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "website" ? fieldContainerActiveClass : ""
                }`}
                onClick={() => handleSectionClick("website")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    Website URL
                  </label>
                </div>
                <input
                  className={getFieldControlClass(editingSection, "website")}
                  value={draftProfile.website}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={() => setEditingSection("website")}
                  onChange={(e) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://your-company.com"
                />
              </div>

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "description"
                    ? fieldContainerActiveClass
                    : ""
                }`}
                onClick={() => handleSectionClick("description")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    Description
                  </label>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <RichTextEditor
                    value={draftProfile.description}
                    onChange={(nextValue) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        description: nextValue,
                      }))
                    }
                    placeholder="Company description"
                    heightClassName="h-[280px]"
                  />
                </div>
              </div>

              <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  className="text-secondary font-semibold hover:text-primary transition-colors order-2 md:order-1"
                  type="button"
                  onClick={handleDiscard}
                >
                  Discard changes
                </button>
                <div className="flex gap-4 w-full md:w-auto order-1 md:order-2">
                  <button
                    className="w-full md:w-auto bg-primary text-on-primary px-10 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default CompanyProfile;
