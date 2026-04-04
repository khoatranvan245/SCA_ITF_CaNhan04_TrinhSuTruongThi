import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CandidateSignup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/candidate-signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            phone: phoneNumber,
            email,
            password,
            confirmPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      setSuccess(true);
      setFullName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        // Redirect to login or dashboard
        navigate("/candidate-login");
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
      <main className="grow flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline">
            JobNest
          </h1>
        </div>
        <div className="w-full max-w-120 surface-container-lowest rounded-xl p-10 md:p-12 shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] border border-outline-variant/15">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
              Create an account
            </h2>
            <p className="text-secondary body-lg">
              Sign up to start your career journey
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
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-on-surface-variant tracking-wide uppercase"
                style={{ fontSize: "0.75rem" }}
              >
                Full Name
              </label>
              <input
                className="block w-full px-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface placeholder:text-outline/60"
                placeholder="Nguyen Van A"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-on-surface-variant tracking-wide uppercase"
                style={{ fontSize: "0.75rem" }}
              >
                Phone Number
              </label>
              <input
                className="block w-full px-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface placeholder:text-outline/60"
                placeholder="0912345678"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
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
                  placeholder="name@company.com"
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
            <div className="space-y-2">
              <label
                className="block text-sm font-semibold text-on-surface-variant tracking-wide uppercase"
                style={{ fontSize: "0.75rem" }}
              >
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span
                    className="material-symbols-outlined text-outline text-sm"
                    data-icon="lock_reset"
                  >
                    lock_reset
                  </span>
                </div>
                <input
                  className="block w-full pl-11 pr-12 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-fixed focus:bg-surface-container-lowest transition-all duration-300 outline-none text-on-surface placeholder:text-outline/60"
                  placeholder="••••••••"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    data-icon={
                      showConfirmPassword ? "visibility_off" : "visibility"
                    }
                  >
                    {showConfirmPassword ? "visibility_off" : "visibility"}
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
                {loading ? "Signing Up..." : "Sign Up"}{" "}
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
              Already have an account?{" "}
              <a
                className="text-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1"
                href="#"
              >
                Log In
              </a>
            </p>
          </div>
        </div>
        <div className="mt-12 max-w-120 text-center">
          <p className="text-secondary text-xs leading-relaxed opacity-70">
            By clicking Sign Up, you agree to our{" "}
            <a className="underline" href="#">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="underline" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
      <footer className="w-full border-t border-outline-variant/15 flex flex-col md:flex-row justify-between items-center px-12 py-8 mt-auto bg-surface dark:bg-slate-950">
        <div className="text-secondary text-sm font-['Manrope'] tracking-wide uppercase mb-4 md:mb-0">
          © 2024 JobNest. All rights reserved.
        </div>
        <div className="flex gap-8">
          <a
            className="text-secondary text-sm font-['Manrope'] tracking-wide uppercase hover:text-primary transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-secondary text-sm font-['Manrope'] tracking-wide uppercase hover:text-primary transition-colors"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-secondary text-sm font-['Manrope'] tracking-wide uppercase hover:text-primary transition-colors"
            href="#"
          >
            Cookie Settings
          </a>
        </div>
      </footer>
    </div>
  );
};

export default CandidateSignup;
