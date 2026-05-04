import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface City {
  city_id: number;
  name: string;
}

const RecruiterSignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/company-profile/cities",
        );
        const data = await response.json();
        if (response.ok && data.cities) {
          setCities(data.cities);
        }
      } catch (err) {
        console.error("Error fetching cities:", err);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/recruiter-signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            confirmPassword,
            companyName,
            cityId: parseInt(cityId),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCompanyName("");
      setCityId("");
      setTimeout(() => {
        // Redirect to login or recruiter dashboard
        navigate("/recruiter-login");
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* TopNavBar Suppression: Hidden for transactional page --> */}
      <main className="grow flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          {/* Branding Header --> */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">
              JobNest
            </h1>
            <p className="text-secondary font-medium italic">
              For Employers &amp; Recruiters
            </p>
          </div>
          {/* Sign Up Form Card --> */}
          <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 editorial-shadow border border-outline-variant/15">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-bold text-primary mb-2">
                Create Recruiter Account
              </h2>
              <p className="text-on-surface-variant body-lg">
                Build your talent network and find your next star hire.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl">
                  Sign up successful! Redirecting to login...
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Field - Full width row --> */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {/* Password Fields - Side-by-side row --> */}
                <div>
                  <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                    Password
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                    Confirm Password
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {/* Company Info - Side-by-side row --> */}
                <div>
                  <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                    Company Name
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none"
                    placeholder="e.g. Acme Corp"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest text-secondary uppercase mb-2">
                    Company Location
                  </label>
                  <select
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-fixed transition-all outline-none appearance-none cursor-pointer"
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    required
                    disabled={citiesLoading}
                  >
                    <option value="" disabled>
                      {citiesLoading ? "Loading locations..." : "Select a location"}
                    </option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Getting Started..." : "Get Started"}
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
            {/* Redirect to Login --> */}
            <div className="mt-8 text-center">
              <p className="text-on-surface-variant font-medium text-sm">
                Already have a recruiter account?
                <a
                  className="text-primary font-bold hover:underline ml-1"
                  href="#"
                >
                  Log In
                </a>
              </p>
            </div>
          </div>
          {/* Subtle Footer Metadata --> */}
          <div className="mt-8 text-center px-4">
            <p className="text-secondary text-xs font-medium opacity-60">
              By signing up, you agree to our Terms of Service and Privacy
              Policy.
              <br />
              Your information is stored securely in the JobNest database.
            </p>
          </div>
        </div>
      </main>
      {/* Shared Footer Component --> */}
      <footer className="bg-surface-container-low dark:bg-slate-950 border-t border-outline-variant/15 w-full flex flex-col md:flex-row justify-between items-center px-12 py-8">
        <div className="mb-4 md:mb-0">
          <p className="font-manrope text-sm text-primary dark:text-blue-200">
            © 2024 JobNest. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            className="font-manrope text-sm text-secondary hover:underline transition-all opacity-80 hover:opacity-100"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="font-manrope text-sm text-secondary hover:underline transition-all opacity-80 hover:opacity-100"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="font-manrope text-sm text-secondary hover:underline transition-all opacity-80 hover:opacity-100"
            href="#"
          >
            Cookie Policy
          </a>
          <a
            className="font-manrope text-sm text-secondary hover:underline transition-all opacity-80 hover:opacity-100"
            href="#"
          >
            Support
          </a>
        </div>
      </footer>
    </div>
  );
};

export default RecruiterSignUp;
