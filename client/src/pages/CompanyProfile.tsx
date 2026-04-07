import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

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
  website: string;
  description: string;
};

type CategoryOption = {
  category_id: number;
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
  | "website"
  | "description"
  | null;

const emptyProfile: CompanyProfileData = {
  name: "",
  category_id: null,
  city_id: null,
  website: "",
  description: "",
};

const fieldContainerClass =
  "space-y-2 relative cursor-pointer section-editable pb-4 transition-all";

const fieldContainerActiveClass = "";

const fieldInputClass =
  "w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl px-4 py-3 outline-none transition-all focus:border-primary";

const CompanyProfile = () => {
  const navigate = useNavigate();
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<CompanyProfileData>(emptyProfile);
  const [draftProfile, setDraftProfile] =
    useState<CompanyProfileData>(emptyProfile);
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
          website: data.company?.website ?? "",
          description: data.company?.description ?? "",
        };

        setProfile(normalizedProfile);
        setDraftProfile(normalizedProfile);

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

  const handleSectionClick = (section: EditableSection) => {
    setSuccess("");
    setEditingSection(section);
  };

  const handleDiscard = () => {
    setDraftProfile(profile);
    setEditingSection(null);
    setError("");
    setSuccess("");
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
      const response = await fetch(
        `http://localhost:3000/api/company-profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draftProfile),
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
        website: data.company?.website ?? "",
        description: data.company?.description ?? "",
      };

      setProfile(updatedProfile);
      setDraftProfile(updatedProfile);
      setEditingSection(null);
      setSuccess("Profile updated successfully.");

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

  if (isLoading) {
    return (
      <div className="bg-background text-on-surface min-h-screen">
        <Navbar />
        <main className="pt-32 pb-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-surface-container-lowest rounded-xl p-10 border border-outline-variant/15">
              Loading company profile...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface antialiased">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
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
              {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "name" ? fieldContainerActiveClass : ""
                }`}
                onClick={() => handleSectionClick("name")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    Company Name
                  </label>
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    edit
                  </span>
                </div>
                {editingSection === "name" ? (
                  <input
                    className={fieldInputClass}
                    value={draftProfile.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    autoFocus
                  />
                ) : (
                  <p className="text-lg font-semibold text-on-surface">
                    {draftProfile.name || "Click to add company name"}
                  </p>
                )}
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
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    edit
                  </span>
                </div>
                {editingSection === "industry" ? (
                  <select
                    className={fieldInputClass}
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
                    autoFocus
                  >
                    <option value="">Select industry</option>
                    {categories.map((category) => (
                      <option
                        key={category.category_id}
                        value={category.category_id}
                      >
                        {category.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-on-surface">
                    {categories.find(
                      (category) =>
                        category.category_id === draftProfile.category_id,
                    )?.title || "Click to select industry"}
                  </p>
                )}
              </div>

              <div
                className={`${fieldContainerClass} ${
                  editingSection === "city" ? fieldContainerActiveClass : ""
                }`}
                onClick={() => handleSectionClick("city")}
              >
                <div className="flex justify-between items-start">
                  <label className="block font-label text-xs font-bold uppercase tracking-widest text-slate-500">
                    City
                  </label>
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    edit
                  </span>
                </div>
                {editingSection === "city" ? (
                  <select
                    className={fieldInputClass}
                    value={draftProfile.city_id ?? ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        city_id: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-on-surface">
                    {cities.find(
                      (city) => city.city_id === draftProfile.city_id,
                    )?.name || "Click to select city"}
                  </p>
                )}
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
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    edit
                  </span>
                </div>
                {editingSection === "website" ? (
                  <input
                    className={fieldInputClass}
                    value={draftProfile.website}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    autoFocus
                  />
                ) : (
                  <p className="text-primary font-medium">
                    {draftProfile.website || "Click to add website"}
                  </p>
                )}
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
                    Company Description
                  </label>
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    edit
                  </span>
                </div>
                {editingSection === "description" ? (
                  <textarea
                    className={`${fieldInputClass} min-h-36`}
                    value={draftProfile.description}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    autoFocus
                  />
                ) : (
                  <div className="bg-surface-container-low/50 rounded-xl p-6 text-on-surface leading-relaxed text-sm whitespace-pre-wrap">
                    {draftProfile.description ||
                      "Click to add company description"}
                  </div>
                )}
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

      <Footer />
    </div>
  );
};

export default CompanyProfile;
