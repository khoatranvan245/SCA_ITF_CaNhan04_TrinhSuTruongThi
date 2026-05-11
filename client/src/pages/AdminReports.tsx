import { useEffect, useState } from "react";

type AdminStatistics = {
  users: {
    admin: number;
    recruiter: number;
    candidate: number;
    total: number;
  };
  userStatus: {
    active: number;
    suspended: number;
  };
  jobs: {
    open: number;
    paused: number;
    closed: number;
    expired: number;
    total: number;
  };
  applications: {
    pending: number;
    reviewing: number;
    accepted: number;
    rejected: number;
    expired: number;
    total: number;
  };
  companies: number;
  candidates: number;
  totalAccounts: number;
};

const AdminReports = () => {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3000/api/admin/statistics",
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load statistics.");
          return;
        }

        setStatistics(data);
      } catch (loadError) {
        console.error("Load statistics error:", loadError);
        setError("An error occurred while loading statistics.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatistics();
  }, []);

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const renderBarChart = (
    data: Record<string, number>,
    max: number,
    colors: Record<string, string>,
  ) => {
    return Object.entries(data)
      .filter(([key]) => key !== "total")
      .map(([key, value]) => (
        <div key={key} className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="capitalize text-sm font-medium text-[#4b5a72]">
              {key}
            </span>
            <span className="text-sm font-bold text-[#0e1c35]">{value}</span>
          </div>
          <div className="w-full h-8 bg-[#eef3f9] rounded-lg overflow-hidden">
            <div
              className={`h-full ${colors[key] || "bg-blue-600"}`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ));
  };

  if (isLoading) {
    return (
      <main className="px-6 md:px-8 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[#64708a]">Loading statistics...</p>
        </div>
      </main>
    );
  }

  if (error || !statistics) {
    return (
      <main className="px-6 md:px-8 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-red-600">{error || "No data available."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-8 py-8 md:py-10">
      <section className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0e1c35] leading-tight">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-[#64708a]">
            Admin Dashboard • Platform overview and statistics
          </p>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Accounts
            </div>
            <div className="text-3xl font-extrabold text-[#0e1c35]">
              {statistics.totalAccounts}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Companies
            </div>
            <div className="text-3xl font-extrabold text-blue-600">
              {statistics.companies}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Total Jobs
            </div>
            <div className="text-3xl font-extrabold text-orange-600">
              {statistics.jobs.total}
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-4 shadow-sm">
            <div className="text-[0.65rem] uppercase text-[#8793a8] mb-2">
              Applications
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {statistics.applications.total}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Users by Role */}
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0e1c35] mb-6">
              Users by Role
            </h3>
            {renderBarChart(
              statistics.users,
              statistics.users.total,
              {
                admin: "bg-purple-600",
                recruiter: "bg-blue-600",
                candidate: "bg-emerald-600",
              },
            )}
          </div>

          {/* User Status */}
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0e1c35] mb-6">
              User Status
            </h3>
            <div className="space-y-4">
              {Object.entries(statistics.userStatus).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="capitalize text-sm font-medium text-[#4b5a72]">
                      {key}
                    </span>
                    <span className="text-sm font-bold text-[#0e1c35]">
                      {value}
                    </span>
                  </div>
                  <div className="w-full h-8 bg-[#eef3f9] rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${
                        key === "active" ? "bg-emerald-600" : "bg-red-600"
                      }`}
                      style={{
                        width: `${(value / statistics.totalAccounts) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs by Status */}
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0e1c35] mb-6">
              Jobs by Status
            </h3>
            {renderBarChart(
              statistics.jobs,
              statistics.jobs.total,
              {
                open: "bg-emerald-600",
                paused: "bg-yellow-600",
                closed: "bg-red-600",
                expired: "bg-gray-600",
              },
            )}
          </div>

          {/* Applications by Status */}
          <div className="rounded-2xl bg-white border border-[#e4e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0e1c35] mb-6">
              Applications by Status
            </h3>
            {renderBarChart(
              statistics.applications,
              statistics.applications.total,
              {
                pending: "bg-yellow-600",
                reviewing: "bg-blue-600",
                accepted: "bg-emerald-600",
                rejected: "bg-red-600",
                expired: "bg-gray-600",
              },
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 rounded-2xl bg-white border border-[#e4e8f0] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0e1c35] mb-6">
            Platform Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                Admins
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {statistics.users.admin}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                Recruiters
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.users.recruiter}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                Candidates
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {statistics.users.candidate}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                Profiles
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {statistics.candidates}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#eef1f6]">
            <h4 className="text-sm font-bold text-[#0e1c35] mb-4">
              Job Market Health
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                  Active Jobs
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {statistics.jobs.open}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                  Pending Apps
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.applications.pending}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                  Accepted
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {statistics.applications.accepted}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#8793a8] mb-2">
                  Rejection Rate
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.applications.total > 0
                    ? getPercentage(
                        statistics.applications.rejected,
                        statistics.applications.total,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminReports;
