import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layouts/Navbar";
import Footer from "../layouts/Footer";

type CompanyListingItem = {
  company_id: number;
  name: string;
  description: string | null;
  category: string;
  location: string;
  open_roles_count: number;
  since_year: number;
};

const toPlainText = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};

const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
};

const CompanyListing = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/company-profile/listing",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load companies");
          return;
        }

        setCompanies(Array.isArray(data.companies) ? data.companies : []);
      } catch (loadError) {
        console.error("Load public companies error:", loadError);
        setError("An error occurred while loading company listings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const location = locationQuery.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesQuery =
        !query ||
        company.name.toLowerCase().includes(query) ||
        company.category.toLowerCase().includes(query) ||
        (company.description || "").toLowerCase().includes(query);

      const matchesLocation =
        !location || company.location.toLowerCase().includes(location);

      return matchesQuery && matchesLocation;
    });
  }, [companies, locationQuery, searchQuery]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationQuery]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const visibleCountText = `Showing ${filteredCompanies.length === 0 ? 0 : startIndex + 1}-${Math.min(endIndex, filteredCompanies.length)} of ${filteredCompanies.length} results`;

  return (
    <div className="bg-surface selection:bg-primary-fixed selection:text-primary min-h-screen flex flex-col text-on-surface">
      <Navbar />
      <main className="w-full max-w-360 mx-auto px-12 py-12 grow">
        <section className="mb-20">
          <div className="max-w-4xl">
            <h1 className="text-primary font-headline font-extrabold text-5xl tracking-tight mb-8 leading-[1.1]">
              Discover leading{" "}
              <span className="text-surface-tint">companies</span>.
            </h1>
          </div>
          <div className="bg-white shadow-xl shadow-slate-200/50 p-1.5 rounded-2xl flex flex-row items-center gap-2 border border-slate-100">
            <div className="grow relative flex items-center border-r border-slate-100">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                search
              </span>
              <input
                className="w-full bg-transparent border-none py-5 pl-14 pr-5 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-base"
                placeholder="Search by company name..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="w-1/4 relative flex items-center">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                location_on
              </span>
              <input
                className="w-full bg-transparent border-none py-5 pl-14 pr-5 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-base"
                placeholder="Location"
                type="text"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
              />
            </div>
            <button className="bg-primary text-on-primary px-10 py-4 rounded-xl font-bold text-base hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
              Find Companies
            </button>
          </div>
        </section>

        <div className="flex items-end justify-between mb-10 border-b border-outline-variant/15 pb-6">
          <div>
            <span className="text-[0.7rem] font-bold tracking-[0.25em] text-secondary uppercase mb-2 block">
              Company Directory
            </span>
            <h2 className="text-3xl font-bold text-primary">
              Featured Companies
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-secondary">
              {visibleCountText}
            </span>
            <div className="h-8 w-px bg-outline-variant/30"></div>
            <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-surface-tint transition-colors">
              Filter{" "}
              <span className="material-symbols-outlined text-lg">tune</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-secondary text-center">
              Loading companies...
            </div>
          ) : error ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 text-red-600 text-center">
              {error}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-secondary text-center">
              No companies found.
            </div>
          ) : (
            paginatedCompanies.map((company) => (
              <div
                key={company.company_id}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative cursor-pointer"
                onClick={() => navigate(`/companies/${company.company_id}`)}
              >
                <div className="flex gap-6 mb-6">
                  <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                    <span className="text-3xl font-extrabold text-blue-900">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-primary mb-1">
                          {company.name}
                        </h3>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {company.category}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                            {company.location}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary-container">
                        {company.open_roles_count} Open Roles
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-3xl">
                      {truncateText(
                        toPlainText(company.description) ||
                          "No company description provided.",
                        200,
                      )}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Since {company.since_year}</span>
                  </div>
                  <button className="text-sm font-bold text-surface-tint hover:underline flex items-center gap-1">
                    View Company{" "}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              <span className="text-sm font-bold pr-2">Previous</span>
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                      currentPage === page
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-secondary hover:bg-surface-container-high"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
            <button
              className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <span className="text-sm font-bold pl-2">Next</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CompanyListing;
