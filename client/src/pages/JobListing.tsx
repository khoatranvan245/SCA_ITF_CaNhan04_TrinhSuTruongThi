import Navbar from "../layouts/Navbar";

const JobListing = () => {
  return (
    <div className="bg-surface selection:bg-primary-fixed selection:text-primary min-h-screen flex flex-col">
      {/* TopNavBar Component  */}
      <Navbar />

      <main className="w-full max-w-360 mx-auto px-12 py-12 grow">
        {/* Hero / Horizontal Search Section  */}
        <section className="mb-20">
          <div className="max-w-4xl">
            <h1 className="text-primary font-headline font-extrabold text-6xl tracking-tight mb-10 leading-[1.1]">
              Discover your{" "}
              <span className="text-surface-tint">next chapter</span>.
            </h1>
          </div>
          <div className="bg-white shadow-xl shadow-slate-200/50 p-2 rounded-2xl flex flex-row items-center gap-2 border border-slate-100">
            <div className="grow relative flex items-center border-r border-slate-100">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                search
              </span>
              <input
                className="w-full bg-transparent border-none py-6 pl-16 pr-6 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-lg"
                placeholder="Search roles, skills, or companies..."
                type="text"
              />
            </div>
            <div className="w-1/4 relative flex items-center">
              <span className="material-symbols-outlined absolute left-6 text-secondary">
                location_on
              </span>
              <input
                className="w-full bg-transparent border-none py-6 pl-16 pr-6 text-on-surface focus:ring-0 outline-none placeholder:text-outline-variant text-lg"
                placeholder="Location"
                type="text"
              />
            </div>
            <button className="bg-primary text-on-primary px-12 py-5 rounded-xl font-bold text-lg hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
              Find Jobs
            </button>
          </div>
        </section>
        {/* Listings Header  */}
        <div className="flex items-end justify-between mb-10 border-b border-outline-variant/15 pb-6">
          <div>
            <span className="text-[0.7rem] font-bold tracking-[0.25em] text-secondary uppercase mb-2 block">
              Curated Listings
            </span>
            <h2 className="text-3xl font-bold text-primary">
              Latest Opportunities
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-secondary">
              Showing 7 of 124 results
            </span>
            <div className="h-8 w-px bg-outline-variant/30"></div>
            <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-surface-tint transition-colors">
              Filter{" "}
              <span className="material-symbols-outlined text-lg">tune</span>
            </button>
          </div>
        </div>
        {/* Job List Container  */}
        <div className="flex flex-col gap-6">
          {/* Item 1  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              {/* Logo  */}
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-blue-900">S</span>
              </div>
              {/* Job Info  */}
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Senior Product Designer (Lead)
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Stellar Systems Co., Ltd
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    Up to $150k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    San Francisco
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    5+ years
                  </span>
                </div>
              </div>
            </div>
            {/* Bottom Row  */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Product Design</span>
                <span className="text-slate-300">|</span>
                <span>UI/UX Architecture</span>
                <span className="text-slate-300">|</span>
                <span>Design Systems</span>
                <span className="text-surface-tint ml-1">+2</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 2 days ago
                </span>
              </div>
            </div>
          </div>
          {/* Item 2  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-slate-700">
                  A
                </span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Software Engineer (Node.js)
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Apex Global Tech Labs
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $180k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Remote
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    3 years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Backend Developer</span>
                <span className="text-slate-300">|</span>
                <span>Node.js / Typescript</span>
                <span className="text-slate-300">|</span>
                <span>AWS Services</span>
                <span className="text-surface-tint ml-1">+1</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted yesterday
                </span>
              </div>
            </div>
          </div>
          {/* Item 3  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-orange-900">
                  M
                </span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Marketing Manager (Senior)
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Moxy Media Group
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $125k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    New York, NY
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    4+ years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Digital Marketing</span>
                <span className="text-slate-300">|</span>
                <span>Brand Strategy</span>
                <span className="text-slate-300">|</span>
                <span>Ad Campaigns</span>
                <span className="text-surface-tint ml-1">+3</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 3 days ago
                </span>
              </div>
            </div>
          </div>
          {/* Item 4  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-green-900">
                  V
                </span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Visual Brand Lead
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Velvet Design Studio
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $140k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Austin, TX
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    2 years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Art Direction</span>
                <span className="text-slate-300">|</span>
                <span>Visual Identity</span>
                <span className="text-slate-300">|</span>
                <span>Typography</span>
                <span className="text-surface-tint ml-1">+4</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 5 hours ago
                </span>
              </div>
            </div>
          </div>
          {/* Item 5  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-purple-900">
                  G
                </span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Senior Growth Analyst
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Growthify Platforms Inc
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $110k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Chicago, IL
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    3-5 years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Data Science</span>
                <span className="text-slate-300">|</span>
                <span>Performance Marketing</span>
                <span className="text-slate-300">|</span>
                <span>SQL / Python</span>
                <span className="text-surface-tint ml-1">+2</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 1 week ago
                </span>
              </div>
            </div>
          </div>
          {/* Item 6  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-yellow-900">
                  N
                </span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      Lead UX Researcher
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      Nexus Design Systems
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $130k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Remote
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    6 years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>User Research</span>
                <span className="text-slate-300">|</span>
                <span>Qualitative Analysis</span>
                <span className="text-slate-300">|</span>
                <span>Usability Testing</span>
                <span className="text-surface-tint ml-1">+1</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 4 days ago
                </span>
              </div>
            </div>
          </div>
          {/* Item 7  */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-surface-tint hover:shadow-xl transition-all duration-300 relative">
            <div className="flex gap-6 mb-6">
              <div className="h-24 w-24 rounded-xl border border-slate-100 bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2">
                <span className="text-3xl font-extrabold text-red-900">D</span>
              </div>
              <div className="grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-1">
                      DevOps Engineer (Cloud)
                    </h3>
                    <p className="text-secondary text-sm font-bold uppercase tracking-wide mb-3">
                      DataCore Infrastructure
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-container">
                    Up to $165k/year
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    Seattle, WA
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                    4 years
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Cloud Architecture</span>
                <span className="text-slate-300">|</span>
                <span>CI/CD Pipeline</span>
                <span className="text-slate-300">|</span>
                <span>Kubernetes / Docker</span>
                <span className="text-surface-tint ml-1">+3</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400 uppercase">
                  Posted 2 days ago
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Pagination Section  */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <button className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">chevron_left</span>
            <span className="text-sm font-bold pr-2">Previous</span>
          </button>
          <div className="flex items-center gap-1">
            <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-sm">
              1
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container-high font-bold text-sm transition-colors">
              2
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container-high font-bold text-sm transition-colors">
              3
            </button>
            <span className="px-2 text-outline">...</span>
            <button className="h-10 w-10 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container-high font-bold text-sm transition-colors">
              18
            </button>
          </div>
          <button className="p-2.5 rounded-lg text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center">
            <span className="text-sm font-bold pl-2">Next</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </main>
      {/* Footer Component  */}
      <footer className="bg-[#f7f9fb] dark:bg-slate-950 w-full mt-24 border-t border-outline-variant/15">
        <div className="max-w-360 mx-auto px-12 py-12 flex flex-col gap-12">
          <div className="flex flex-row justify-between items-start">
            <div className="flex flex-col gap-4">
              <span className="text-2xl font-bold tracking-tighter text-primary dark:text-white">
                JobNest
              </span>
              <p className="font-manrope text-sm text-secondary dark:text-slate-400 max-w-xs">
                Curating the future of professional work with intelligence and
                serenity.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div className="flex flex-col gap-4">
                <span className="font-bold text-primary dark:text-white text-sm uppercase tracking-widest">
                  Platform
                </span>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Find Jobs
                </a>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Companies
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="font-bold text-primary dark:text-white text-sm uppercase tracking-widest">
                  Employers
                </span>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Post a Job
                </a>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Hiring Solutions
                </a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="font-bold text-primary dark:text-white text-sm uppercase tracking-widest">
                  Legal
                </span>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Privacy Policy
                </a>
                <a
                  className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-blue-300 transition-colors text-sm"
                  href="#"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between items-center pt-10 border-t border-slate-200/50 dark:border-slate-800/50 font-manrope text-sm tracking-wide uppercase">
            <p className="text-secondary dark:text-slate-400">
              © 2024 JobNest Curator. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a
                className="text-secondary dark:text-slate-500 hover:text-primary dark:hover:text-white transition-all duration-300"
                href="#"
              >
                Cookie Settings
              </a>
              <a
                className="text-secondary dark:text-slate-500 hover:text-primary dark:hover:text-white transition-all duration-300"
                href="#"
              >
                Help Center
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JobListing;
