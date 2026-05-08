import { useState } from "react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buildAdminUrl = (path: string) => {
    const { protocol, hostname, port } = window.location;
    let targetHostname = hostname;

    if (!hostname.startsWith("admin.")) {
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        targetHostname = "admin.localhost";
      } else {
        targetHostname = `admin.${hostname}`;
      }
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const hostWithPort = port ? `${targetHostname}:${port}` : targetHostname;

    return `${protocol}//${hostWithPort}${normalizedPath}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/admin-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.user.user_id);

      setEmail("");
      setPassword("");

      setTimeout(() => {
        window.location.assign(buildAdminUrl("/admin/jobs"));
      }, 1000);
    } catch (loginError) {
      setError("An error occurred. Please try again.");
      console.error("Admin login error:", loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">
              JobNest
            </h1>
            <p className="text-secondary font-medium italic">For Admins</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 editorial-shadow border border-outline-variant/15">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">
                Admin Log In
              </h2>
              <p className="text-on-surface-variant body-lg">
                Access system oversight and platform management tools.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                  Email Address
                </label>
                <input
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                  placeholder="admin@jobnest.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                  Password
                </label>
                <input
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="pt-4">
                <button
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Log In"}
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
            <div className="mt-8 text-center">
              <p className="text-on-surface-variant font-medium text-sm">
                Admin access is restricted to authorized system roles.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center px-4">
            <p className="text-secondary text-xs font-medium opacity-60">
              By logging in, you agree to our Terms of Service and Privacy
              Policy.
              <br />
              Your information is stored securely in the JobNest database.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
