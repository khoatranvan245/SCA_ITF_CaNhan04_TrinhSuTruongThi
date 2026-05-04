import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";

type StoredUser = {
  user_id?: number;
  role?: {
    role_id?: number;
    title?: string;
  };
};

type Category = {
  job_category_id: number;
  title: string;
};

type SkillOption = {
  skill_id: number;
  name: string;
};

const toDateOnly = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const toIsoDate = (value: string): string | null => {
  const parsedDate = toDateOnly(value);
  if (!parsedDate) {
    return null;
  }

  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
};

const normalizeNumericInput = (value: string) => value.replace(/\D/g, "");

const formatCurrencyInput = (value: string) => {
  if (!value) {
    return "";
  }

  const normalizedValue = normalizeNumericInput(value);
  if (!normalizedValue) {
    return "";
  }

  return Number(normalizedValue).toLocaleString("vi-VN");
};

const normalizeEditorHtmlForStorage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "<p><br></p>") {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "text/html");

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

const JobPost = () => {
  const navigate = useNavigate();
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);
  const [showSkillOptions, setShowSkillOptions] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    description: "",
    requirements: "",
    experienceYears: "",
    salaryMin: "",
    salaryMax: "",
    benefits: "",
    expirationDate: "",
  });

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/jobs/categories",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load categories");
          return;
        }

        setCategories(data.categories || []);
      } catch (loadError) {
        console.error("Load job categories error:", loadError);
        setError("Unable to load job categories.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

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
    const selected = new Set(skills.map((skill) => skill.toLowerCase()));
    return skillOptions.filter(
      (option) => !selected.has(option.name.toLowerCase()),
    );
  }, [skillOptions, skills]);

  const handleInputChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSalaryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const normalizedValue = normalizeNumericInput(value);

    setFormData((current) => ({
      ...current,
      [name]: normalizedValue,
    }));
  };

  const handleExpirationDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      expirationDate: event.target.value,
    }));
  };

  const handleAddSkill = () => {
    const nextSkill = skillInput.trim();

    if (!nextSkill) {
      return;
    }

    const matchedSkill = availableSkillOptions.find(
      (option) => option.name.toLowerCase() === nextSkill.toLowerCase(),
    );

    if (!matchedSkill) {
      return;
    }

    setSkills((current) => [...current, matchedSkill.name]);
    setSkillInput("");
    setSkillOptions([]);
    setShowSkillOptions(false);
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((current) =>
      current.filter(
        (skill) => skill.toLowerCase() !== skillToRemove.toLowerCase(),
      ),
    );
  };

  const handleSelectSkill = (skillName: string) => {
    setSkills((current) => [...current, skillName]);
    setSkillInput("");
    setSkillOptions([]);
    setShowSkillOptions(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("Please login as a recruiter before posting a job.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Job title is required.");
      return;
    }

    if (!formData.categoryId) {
      setError("Job category is required.");
      return;
    }

    if (!formData.expirationDate) {
      setError("Expiration date is required.");
      return;
    }

    const expirationDate = toDateOnly(formData.expirationDate);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (!expirationDate || expirationDate <= todayStart) {
      setError("Expiration date must be later than today.");
      return;
    }

    const expirationDateIso = toIsoDate(formData.expirationDate);
    if (!expirationDateIso) {
      setError("Expiration date is invalid.");
      return;
    }

    const salaryMin = formData.salaryMin ? Number(formData.salaryMin) : null;
    const salaryMax = formData.salaryMax ? Number(formData.salaryMax) : null;
    const experienceYears =
      formData.experienceYears === "" ? null : Number(formData.experienceYears);

    if (
      experienceYears !== null &&
      (!Number.isInteger(experienceYears) || experienceYears < 0)
    ) {
      setError("Experience years must be a non-negative integer.");
      return;
    }

    if (
      salaryMin !== null &&
      salaryMax !== null &&
      Number.isFinite(salaryMin) &&
      Number.isFinite(salaryMax) &&
      salaryMin > salaryMax
    ) {
      setError("Salary minimum cannot exceed maximum.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:3000/api/jobs/recruiter/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            category_id: Number(formData.categoryId),
            description: normalizeEditorHtmlForStorage(formData.description),
            requirements: normalizeEditorHtmlForStorage(formData.requirements),
            experience_years: experienceYears,
            salary_min: salaryMin,
            salary_max: salaryMax,
            benefits: normalizeEditorHtmlForStorage(formData.benefits),
            expiration_date: expirationDateIso,
            skills,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create job");
        return;
      }

      setSuccess("Job created successfully.");
      navigate("/job-management");
    } catch (submitError) {
      console.error("Create job error:", submitError);
      setError("An error occurred while creating the job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* Header Section  */}
      <div className="mb-12">
        <h1 className="text-[3.5rem] font-extrabold tracking-tight text-primary leading-tight mb-4">
          Post a Job
        </h1>
        <p className="text-secondary text-lg max-w-2xl leading-relaxed">
          Fill in the details below to find your next exceptional hire. Your
          listing will be curated for our professional network.
        </p>
      </div>
      {/* Form Container  */}
      <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)]">
        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Basic Info Grid  */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                Title
              </label>
              <input
                className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 outline-none focus:border-black transition-all text-on-surface placeholder:text-outline/50"
                name="title"
                placeholder="e.g. Senior Product Designer"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                Category
              </label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 outline-none focus:border-black transition-all appearance-none text-on-surface"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                >
                  <option value="">
                    {isLoadingCategories
                      ? "Loading categories..."
                      : "Select Category"}
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category.job_category_id}
                      value={category.job_category_id}
                    >
                      {category.title}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
          {/* Rich Text Areas  */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(nextValue) =>
                  setFormData((current) => ({
                    ...current,
                    description: nextValue,
                  }))
                }
                placeholder="Describe the role and day-to-day responsibilities..."
                heightClassName="h-80"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                Requirements
              </label>
              <RichTextEditor
                value={formData.requirements}
                onChange={(nextValue) =>
                  setFormData((current) => ({
                    ...current,
                    requirements: nextValue,
                  }))
                }
                placeholder="List core qualifications and skills..."
                heightClassName="h-65"
              />
            </div>
          </div>
          {/* Required Skills Section  */}
          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              Required Skills
            </label>
            <div className="space-y-4">
              <div className="relative">
                <input
                  className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 outline-none focus:border-black transition-all text-on-surface placeholder:text-outline/50"
                  placeholder="Search skills ..."
                  type="text"
                  value={skillInput}
                  onFocus={() => setShowSkillOptions(true)}
                  onChange={(event) => {
                    setSkillInput(event.target.value);
                    setShowSkillOptions(true);
                  }}
                  onKeyDown={handleSkillKeyDown}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm"
                  type="button"
                  onClick={handleAddSkill}
                >
                  Add
                </button>
                {showSkillOptions && skillInput.trim() && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-300 bg-white shadow-lg overflow-hidden">
                    {isLoadingSkills ? (
                      <div className="px-4 py-3 text-sm text-secondary">
                        Searching skills...
                      </div>
                    ) : availableSkillOptions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-secondary">
                        No matching skills.
                      </div>
                    ) : (
                      <ul className="max-h-56 overflow-y-auto">
                        {availableSkillOptions.map((option) => (
                          <li key={option.skill_id}>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-3 text-sm text-on-surface hover:bg-gray-50 transition-colors"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectSkill(option.name)}
                            >
                              {option.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-semibold border border-secondary/20 transition-all hover:bg-secondary/20"
                  >
                    <span>{skill}</span>
                    <button
                      className="flex items-center justify-center hover:text-error"
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Salary Range  */}
          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              Salary Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline font-medium text-xs uppercase tracking-wide">
                  VND
                </span>
                <input
                  className="w-full bg-white border border-gray-300 rounded-xl px-5 pr-16 py-4 outline-none focus:border-black transition-all"
                  name="salaryMin"
                  placeholder="Min"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(formData.salaryMin)}
                  onChange={handleSalaryChange}
                />
              </div>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline font-medium text-xs uppercase tracking-wide">
                  VND
                </span>
                <input
                  className="w-full bg-white border border-gray-300 rounded-xl px-5 pr-16 py-4 outline-none focus:border-black transition-all"
                  name="salaryMax"
                  placeholder="Max"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(formData.salaryMax)}
                  onChange={handleSalaryChange}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              Years of Experience
            </label>
            <input
              className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 outline-none focus:border-black transition-all text-on-surface"
              name="experienceYears"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 2"
              value={formData.experienceYears}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  experienceYears: normalizeNumericInput(event.target.value),
                }))
              }
            />
          </div>
          {/* Expiration Date  */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              Benefits
            </label>
            <RichTextEditor
              value={formData.benefits}
              onChange={(nextValue) =>
                setFormData((current) => ({
                  ...current,
                  benefits: nextValue,
                }))
              }
              placeholder="List company perks, healthcare, or other advantages..."
              heightClassName="h-65"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
              Expiration Date
            </label>
            <div className="gap-4">
              <div className="space-y-1">
                <div className="relative">
                  <input
                    className="w-full bg-white border border-gray-300 rounded-xl px-5 py-4 outline-none focus:border-black transition-all text-on-surface"
                    name="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={handleExpirationDateChange}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Actions  */}
          <div className="flex flex-col gap-4 pt-6 border-t border-outline-variant/15">
            {(error || success) && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
              >
                {error || success}
              </div>
            )}
            <button
              className="bg-primary text-on-primary rounded-xl px-8 py-4 font-bold tracking-tight hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Job"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default JobPost;
