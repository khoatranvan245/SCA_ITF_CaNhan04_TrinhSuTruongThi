import { Fragment, useEffect, useMemo, useState } from "react";

type AdminAccount = {
  user_id: number;
  email: string;
  role_id: number;
  role_title: string;
  role_description: string | null;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
  companies_count: number;
  candidates_count: number;
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

const AdminAccount = () => {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleGroup, setRoleGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAccountId, setExpandedAccountId] = useState<number | null>(
    null,
  );
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);
  const [editingStatuses, setEditingStatuses] = useState<
    Record<number, "active" | "suspended">
  >({});
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/admin/accounts",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load admin accounts.");
          return;
        }

        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      } catch (loadError) {
        console.error("Load admin accounts error:", loadError);
        setError("An error occurred while loading accounts.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAccounts();
  }, []);

  const toggleExpandRow = (accountId: number) => {
    setExpandedAccountId((currentExpandedAccountId) =>
      currentExpandedAccountId === accountId ? null : accountId,
    );
  };

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesRoleGroup =
        roleGroup === "all" ||
        account.role_title.toLowerCase().includes(roleGroup);
      const matchesQuery =
        !query ||
        account.email.toLowerCase().includes(query) ||
        account.role_title.toLowerCase().includes(query);

      return matchesRoleGroup && matchesQuery;
    });
  }, [accounts, roleGroup, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleGroup, searchQuery]);

  useEffect(() => {
    if (openStatusMenuId === null) return;

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-status-menu]")) {
        setOpenStatusMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () =>
      document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [openStatusMenuId]);

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/accounts/${userId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to update account status");
        return;
      }

      setAccounts((prev) =>
        prev.map((a) =>
          a.user_id === userId ? { ...a, status: newStatus as any } : a,
        ),
      );
      setEditingStatuses((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error) {
      console.error("Status update error:", error);
      alert("An error occurred while updating account status");
    }
  };

  const handleDeleteAccount = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/accounts/${userId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Failed to delete account");
        return;
      }

      setAccounts((prev) => prev.filter((a) => a.user_id !== userId));
      setExpandedAccountId(null);
    } catch (error) {
      console.error("Delete account error:", error);
      alert("An error occurred while deleting the account");
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, endIndex);

  const counts = useMemo(() => {
    return accounts.reduce(
      (accumulator, account) => {
        accumulator.total += 1;
        const normalizedRole = account.role_title.toLowerCase();
        if (normalizedRole.includes("admin")) {
          accumulator.admin += 1;
        }
        if (normalizedRole.includes("recruiter")) {
          accumulator.recruiter += 1;
        }
        if (normalizedRole.includes("candidate")) {
          accumulator.candidate += 1;
        }
        return accumulator;
      },
      { total: 0, admin: 0, recruiter: 0, candidate: 0 },
    );
  }, [accounts]);

  return (
    <main className="px-6 md:px-8 py-8 md:py-10">
      <section className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0e1c35] leading-tight">
            Manage accounts and roles
          </h1>
          <p className="mt-2 text-sm text-[#64708a]">
            Admin Dashboard • Review system accounts from all roles.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Accounts
            </div>
            <div className="text-2xl font-extrabold text-[#0e1c35]">
              {counts.total}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Admins
            </div>
            <div className="text-2xl font-extrabold text-[#0d2446]">
              {counts.admin}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Recruiters
            </div>
            <div className="text-2xl font-extrabold text-orange-600">
              {counts.recruiter}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Candidates
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {counts.candidate}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e4e8f0] rounded-[1.75rem] shadow-[0_18px_50px_rgba(16,24,40,0.08)] overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-[#eef1f6] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "All", value: "all" },
                  { label: "Admins", value: "admin" },
                  { label: "Recruiters", value: "recruiter" },
                  { label: "Candidates", value: "candidate" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRoleGroup(item.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      roleGroup === item.value
                        ? "bg-[#0d2446] text-white shadow-sm"
                        : "bg-[#f6f8fc] text-[#50617b] hover:bg-[#eef3f9]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[20rem] relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96a2b6] text-[18px]">
                search
              </span>
              <input
                className="w-full h-11 rounded-xl border border-[#e3e8f0] bg-[#f6f8fc] pl-11 pr-4 text-sm text-[#0e1c35] placeholder:text-[#96a2b6] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                placeholder="Search accounts..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190">
              <thead className="bg-[#f8fafc] text-[#8a96aa] text-[0.65rem] uppercase font-bold">
                <tr>
                  <th className="px-6 md:px-8 py-4 text-left">Account</th>
                  <th className="px-6 md:px-8 py-4 text-left">Email</th>
                  <th className="px-6 md:px-8 py-4 text-left">Status</th>
                  <th className="px-6 md:px-8 py-4 text-left">Role</th>
                  <th className="px-6 md:px-8 py-4 text-left">Created Date</th>
                  <th className="px-6 md:px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={5}
                    >
                      Loading accounts...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-red-600"
                      colSpan={5}
                    >
                      {error}
                    </td>
                  </tr>
                ) : paginatedAccounts.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 md:px-8 py-12 text-center text-[#64708a]"
                      colSpan={5}
                    >
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => (
                    <Fragment key={account.user_id}>
                      <tr
                        className="border-t border-[#eef1f6] hover:bg-[#fafcff] transition-colors cursor-pointer"
                        onClick={() => toggleExpandRow(account.user_id)}
                      >
                        <td className="px-6 md:px-8 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#edf3fb] flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[#6480aa]">
                                account_circle
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#0e1c35]">
                                User #{String(account.user_id).padStart(4, "0")}
                              </p>
                              <p className="text-xs text-[#8491a6]">
                                ID: US-
                                {String(account.user_id).padStart(4, "0")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <p className="font-medium">{account.email}</p>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          <div>
                            <p className="font-medium">{account.role_title}</p>
                            <p className="text-xs text-[#8491a6]">
                              {account.role_description || "No description"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase ${account.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                          >
                            {account.status === "active"
                              ? "Active"
                              : "Suspended"}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-[#4b5a72]">
                          {formatDate(account.created_at)}
                        </td>
                        <td className="px-6 md:px-8 py-5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#eef3f9] text-[#60708b]"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpandRow(account.user_id);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {expandedAccountId === account.user_id
                                ? "expand_less"
                                : "expand_more"}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {expandedAccountId === account.user_id && (
                        <tr className="border-t border-[#eef1f6] bg-[#f8fafc]">
                          <td colSpan={5} className="px-6 md:px-8 py-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Role
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {account.role_title}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Company Profiles
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {account.companies_count}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Candidate Profiles
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {account.candidates_count}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                                  Updated Date
                                </p>
                                <p className="text-sm font-semibold text-[#0e1c35]">
                                  {formatDate(account.updated_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mt-4">
                              <div className="flex-1">
                                <label className="text-xs font-bold uppercase text-[#8793a8] mb-2 block">
                                  Change Status
                                </label>
                                <div className="flex gap-2 items-center">
                                  <div
                                    className="relative flex-1"
                                    data-status-menu
                                  >
                                    <button
                                      type="button"
                                      className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e3e8f0] bg-white px-3 text-sm font-medium text-[#0e1c35] focus:outline-none focus:ring-2 focus:ring-[#b9cce8]"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenStatusMenuId((current) =>
                                          current === account.user_id
                                            ? null
                                            : account.user_id,
                                        );
                                      }}
                                    >
                                      <span>
                                        {editingStatuses[account.user_id] ||
                                          account.status}
                                      </span>
                                      <span className="material-symbols-outlined text-[18px] text-[#8090a6]">
                                        {openStatusMenuId === account.user_id
                                          ? "expand_less"
                                          : "expand_more"}
                                      </span>
                                    </button>

                                    {openStatusMenuId === account.user_id && (
                                      <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-[#e3e8f0] bg-white shadow-lg">
                                        {(["active", "suspended"] as const).map(
                                          (option) => (
                                            <button
                                              key={option}
                                              type="button"
                                              className="block w-full px-3 py-2 text-left text-sm text-[#0e1c35] hover:bg-[#eef3f9]"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                setEditingStatuses((prev) => ({
                                                  ...prev,
                                                  [account.user_id]: option,
                                                }));
                                                setOpenStatusMenuId(null);
                                              }}
                                            >
                                              {option === "active"
                                                ? "Active"
                                                : "Suspended"}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newStatus =
                                        editingStatuses[account.user_id] ||
                                        account.status;
                                      if (newStatus !== account.status) {
                                        void handleStatusChange(
                                          account.user_id,
                                          newStatus,
                                        );
                                      }
                                    }}
                                    className="px-4 py-2.5 rounded-lg bg-[#0d2446] text-white font-semibold hover:opacity-90 transition-colors whitespace-nowrap text-sm"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteAccount(account.user_id);
                                }}
                                className="px-4 py-2.5 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors whitespace-nowrap text-sm"
                              >
                                Delete Account
                              </button>
                            </div>
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
              Showing {filteredAccounts.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, filteredAccounts.length)} of{" "}
              {filteredAccounts.length} accounts
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
                disabled={currentPage === totalPages}
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

export default AdminAccount;
