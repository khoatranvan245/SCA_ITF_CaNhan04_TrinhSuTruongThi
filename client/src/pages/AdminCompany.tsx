import { Fragment, useEffect, useMemo, useState } from "react";

type AdminCompany = {
  company_id: number;
  name: string;
  description: string | null;
  website: string | null;
  avatar_url: string | null;
  user_email: string;
  user_role: string;
  user_status: "active" | "suspended";
  category: string;
  city: string;
  address: string | null;
  jobs_count: number;
  created_at: string;
  updated_at: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminCompany = () => {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(
    null,
  );
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/admin/companies",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load admin companies.");
          return;
        }

        setCompanies(Array.isArray(data.companies) ? data.companies : []);
      } catch (loadError) {
        console.error("Load admin companies error:", loadError);
        setError("An error occurred while loading companies.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCompanies();
  }, []);

  const toggleExpandRow = (companyId: number) => {
    setExpandedCompanyId((currentExpandedCompanyId) =>
      currentExpandedCompanyId === companyId ? null : companyId,
    );
  };

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesQuery =
        !query ||
        company.name.toLowerCase().includes(query) ||
        company.user_email.toLowerCase().includes(query) ||
        company.category.toLowerCase().includes(query) ||
        company.city.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || company.user_status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCompanies.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const counts = useMemo(() => {
    return companies.reduce(
      (accumulator, company) => {
        accumulator.total += 1;
        if (company.user_status === "active") {
          accumulator.active += 1;
        } else if (company.user_status === "suspended") {
          accumulator.suspended += 1;
        }
        return accumulator;
      },
      { total: 0, active: 0, suspended: 0 },
    );
  }, [companies]);

  return (
    <main className="px-6 md:px-8 py-8 md:py-10">
      <section className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0e1c35] leading-tight">
            Manage companies
          </h1>
          <p className="mt-2 text-sm text-[#64708a]">
            Admin Dashboard • Review all companies in the system.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Companies
            </div>
            <div className="text-2xl font-extrabold text-[#0e1c35]">
              {counts.total}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Active
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {counts.active}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Suspended
            </div>
            <div className="text-2xl font-extrabold text-red-600">
              {counts.suspended}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Jobs
            </div>
            <div className="text-2xl font-extrabold text-blue-600">
              {companies.reduce((sum, c) => sum + c.jobs_count, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e4e8f0] rounded-[1.75rem] shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-[#eef1f6] flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-[#0d2446] text-white shadow-sm"
                      : "bg-[#f1f5fa] text-[#4b5a72] hover:bg-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === "active"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-[#f1f5fa] text-[#4b5a72] hover:bg-white"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("suspended")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === "suspended"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-[#f1f5fa] text-[#4b5a72] hover:bg-white"
                  }`}
                >
                  Suspended
                </button>
              </div>
              <div className="w-full lg:w-[20rem] relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96a2b6] text-[18px]">
                  search
                </span>
                <input
                  className="w-full h-11 rounded-xl border border-[#e3e8f0] bg-[#f6f8fc] pl-11 pr-4 text-sm text-[#0e1c35] placeholder:text-[#96a2b6] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                  placeholder="Search companies..."
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190">
              <thead className="bg-[#f8fafc] text-[#8a96aa] text-[0.65rem] uppercase font-bold">
                <tr>
                  <th className="px-6 md:px-8 py-4 text-left">Company</th>
                  <th className="px-6 md:px-8 py-4 text-left">Owner Email</th>
                  <th className="px-6 md:px-8 py-4 text-left">Status</th>
                  <th className="px-6 md:px-8 py-4 text-left">Category</th>
                  <th className="px-6 md:px-8 py-4 text-left">Jobs</th>
                  <th className="px-6 md:px-8 py-4 text-left">Created Date</th>
                  <th className="px-6 md:px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={6}
                    >
                      Loading companies...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-red-600"
                      colSpan={6}
                    >
                      {error}
                    </td>
                  </tr>
                ) : paginatedCompanies.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={6}
                    >
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map((company) => (
                    <Fragment key={company.company_id}>
                      <tr
                        className="border-t border-[#eef1f6] hover:bg-[#fafcff] transition-colors cursor-pointer"
                        onClick={() => toggleExpandRow(company.company_id)}
                      >
                        <td className="px-6 md:px-8 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#edf3fb] flex items-center justify-center overflow-hidden shrink-0">
                              {company.avatar_url ? (
                                <img
                                  src={company.avatar_url}
                                  alt={company.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[#6480aa]">
                                  domain
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#0e1c35]">
                                {company.name}
                              </p>
                              <p className="text-xs text-[#8491a6]">
                                ID: CO-
                                {String(company.company_id).padStart(4, "0")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <p className="font-medium">{company.user_email}</p>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              company.user_status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {company.user_status === "active"
                              ? "Active"
                              : "Suspended"}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <div>
                            <p className="font-medium">{company.category}</p>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <p className="font-medium">{company.jobs_count}</p>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          {formatDate(company.created_at)}
                        </td>
                        <td className="px-6 md:px-8 py-5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#eef3f9] text-[#60708b]"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpandRow(company.company_id);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {expandedCompanyId === company.company_id
                                ? "expand_less"
                                : "expand_more"}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {expandedCompanyId === company.company_id && (
                        <tr className="border-t border-[#eef1f6] bg-[#f8fafc]">
                          <td colSpan={6} className="px-6 md:px-8 py-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Status
                                </p>
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    company.user_status === "active"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {company.user_status === "active"
                                    ? "Active"
                                    : "Suspended"}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Owner Role
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {company.user_role}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Location
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {company.city}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Jobs Posted
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {company.jobs_count}
                                </p>
                              </div>
                            </div>
                            {company.description && (
                              <div className="mt-4">
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Description
                                </p>
                                <p className="text-sm text-[#4b5a72]">
                                  {company.description}
                                </p>
                              </div>
                            )}
                            {company.website && (
                              <div className="mt-4">
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Website
                                </p>
                                <p className="text-sm text-blue-600 hover:underline">
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {company.website}
                                  </a>
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 md:px-8 py-5 border-t border-[#eef1f6] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-bold uppercase text-[#6f7f98]">
              Showing {filteredCompanies.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, filteredCompanies.length)} of{" "}
              {filteredCompanies.length} companies
            </p>

            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-[#8c97a8] hover:bg-[#f1f5fa] disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(0, 4)
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg font-semibold ${
                        currentPage === page
                          ? "bg-[#0d2446] text-white shadow-sm"
                          : "text-[#5d6d85] hover:bg-[#f1f5fa]"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                {totalPages > 4 && (
                  <span className="px-2 text-[#90a0b6]">...</span>
                )}
                {totalPages > 4 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-9 h-9 rounded-lg font-semibold ${
                      currentPage === totalPages
                        ? "bg-[#0d2446] text-white shadow-sm"
                        : "text-[#5d6d85] hover:bg-[#f1f5fa]"
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-[#8c97a8] hover:bg-[#f1f5fa] disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminCompany;
