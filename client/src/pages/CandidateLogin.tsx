import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CandidateLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store token/user info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.user.user_id);

      setEmail("");
      setPassword("");
      setTimeout(() => {
        // Redirect to job listing after successful login
        navigate("/job-listing");
      }, 1000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <main className="grow flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline">
            JobNest
          </h1>
        </div>
        <div className="w-full max-w-md surface-container-lowest rounded-xl p-10 md:p-12 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] border border-outline-variant/15">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-secondary body-lg">
              Log in to your candidate account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-on-surface-variant tracking-wide uppercase"
                style={{ fontSize: "0.75rem" }}
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span
                    className="material-symbols-outlined text-outline text-sm"
                    data-icon="mail"
                  >
                    mail
                  </span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface placeholder:text-outline/60"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-on-surface-variant tracking-wide uppercase"
                style={{ fontSize: "0.75rem" }}
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span
                    className="material-symbols-outlined text-outline text-sm"
                    data-icon="lock"
                  >
                    lock
                  </span>
                </div>
                <input
                  className="block w-full pl-11 pr-12 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface placeholder:text-outline/60"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    data-icon={showPassword ? "visibility_off" : "visibility"}
                  >
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <div className="pt-4">
              <button
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Log In"}{" "}
                <span
                  className="material-symbols-outlined text-lg"
                  data-icon="arrow_forward"
                >
                  arrow_forward
                </span>
              </button>
            </div>
          </form>
          <div className="mt-10 pt-8 border-outline-variant/15 flex flex-col items-center gap-6">
            <p className="text-on-surface-variant text-sm">
              Don't have an account?{" "}
              <a
                className="text-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1 cursor-pointer"
                onClick={() => navigate("/candidate-signup")}
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateLogin;
