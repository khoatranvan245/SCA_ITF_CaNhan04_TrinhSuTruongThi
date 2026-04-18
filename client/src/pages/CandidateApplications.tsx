const CandidateApplications = () => {
  return (
    <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      {/* Editorial Header  */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[3.5rem] font-extrabold text-primary tracking-tight leading-tight mb-4">
            My Applications
          </h1>
          <div className="flex items-center gap-8 text-secondary">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">12</span>
              <span className="text-sm font-medium tracking-wide">
                TOTAL SUBMITTED
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold tracking-wide shadow-lg shadow-primary/10 hover:bg-surface-tint transition-colors">
            <span className="material-symbols-outlined text-lg">
              filter_list
            </span>
            Filter
          </button>
        </div>
      </div>
      {/* Content Grid: Asymmetrical approach  */}
      <div className="grid grid-cols-1 gap-6">
        {/* Application Row 1: Success  */}
        <div className="group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center p-3 shrink-0">
              <img
                alt="Company Logo"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCV25UXo8hzkx39eDlEtoFplDo9UuSHcoxJ7Vmc023ZRCL_rwEAU_BePptxuBV70AK7lUDbwGVJQ0sQCZ6TkeBDY7mKuopNu9XbI8eUslngNvEUtQktmw0o1s_oE3DTad_8vn4-e-dE3e0K75Y89Zoq7OU3rQ_mz6Ad14aotccnDriBoGubJGdmaB7LxriPlqN5IuVWo1ZO2k5o1zQmrA7R3FdjRCZYbOBZEyCTZdh29EsfKi4R_9eotqRovIfHfL2rG_FjNqS7qBw"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-surface-tint transition-colors">
                Senior Product Designer
              </h3>
              <p className="text-secondary font-medium mt-0.5">
                Lumina Creative Studio •{" "}
                <span className="text-sm text-outline">Full-time</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_160px_48px] items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Applied on
              </span>
              <span className="text-sm font-semibold text-primary">
                Oct 12, 2023
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Status
              </span>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2"></span>
                  Success
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="p-2 rounded-xl hover:bg-surface-container-low text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        {/* Application Row 2: Submitted  */}
        <div className="group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center p-3 shrink-0">
              <img
                alt="Company Logo"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNTjab0r-uoT6X-qmohpZqdKkn0tvH82qmJnsfXk2T-smQcrNv35TWBomvf_QG2SG8mwvpF42_kZ6tfQAAPTjbRyADroSic8ADZy1bt48iSsh4AxZqyWXPpBxKvuenp8NEepJUzXgfWJxc4u_4OWP62fkiO04Y3enRuGTbOvVlvS0gIkfwT4Vh1KySyq_pkSZSKwiW9Moeh82B9H-3sRPEfKzOEWdB60lR3M2OAOSPESY5GdaWdC-SlktyxN_QePd7iIW_HFsNcas"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-surface-tint transition-colors">
                Lead UX Researcher
              </h3>
              <p className="text-secondary font-medium mt-0.5">
                Innova Systems •{" "}
                <span className="text-sm text-outline">Contract</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_160px_48px] items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Applied on
              </span>
              <span className="text-sm font-semibold text-primary">
                Oct 09, 2023
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Status
              </span>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary-fixed text-primary-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container mr-2"></span>
                  Submitted
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="p-2 rounded-xl hover:bg-surface-container-low text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        {/* Application Row 3: Failed  */}
        <div className="group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] ring-1 ring-outline-variant/10 opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0">
          <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center p-3 shrink-0">
              <img
                alt="Company Logo"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB901p29sWdC0FVUsT6eCbxouumaSr6ize6jxUr_AyjP-G44Y766_8l2BM6g6JkA1NxLx7tZha8J9aGqe7mJzxSKR_hmq0R4oaQiwOE8OWEF8C43WX2LYfVlLZFkaT73LlMdc2Q3A5h803NuaUFV35kQuFnzMQVEPj60DHfHXhVWLi5nYpbDExIbMkg6eUKTqMXfJAv3KfJ9S8SA0PknkWkm8f4pKGQW89zHLv2a2OgD20JcbtgPg7VCErVU2YN1ud7i5X0xKa0rws"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-surface-tint transition-colors">
                Design Director
              </h3>
              <p className="text-secondary font-medium mt-0.5">
                Nexus Media Group •{" "}
                <span className="text-sm text-outline">Full-time</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_160px_48px] items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Applied on
              </span>
              <span className="text-sm font-semibold text-primary">
                Sep 28, 2023
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Status
              </span>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-error mr-2"></span>
                  Failed
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="p-2 rounded-xl hover:bg-surface-container-low text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        {/* Application Row 4: Reviewed  */}
        <div className="group bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all duration-300 hover:shadow-[0_40px_60px_-5px_rgba(25,28,30,0.06)] ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-6 mb-4 md:mb-0 flex-1">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center p-3 shrink-0">
              <img
                alt="Company Logo"
                className="w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD61-bnS1OqW-STLLAC4uZREPTlmFqTLoFgX-IJtDFTl9l4UAQnUYZc3KRxeZqgBkoCYhQ0NevP_6HLbMHPXAHIP566B7nXZlpLfrcSqhMxnYEA5p_QkLsN8OpUDs2ziJoMG0bDUL054IM3tlkSqwSxZfxTx-8HwxS-INLWB6vKw1cMrs20nENsz4Fe54O6fVa-JTXUKNIYQ6vgRmA5TYC_w39VAeiSd1Os5hkInApXTuo5EbGZ-9I8oF0nOa4vQKx_4yYAYJQtT78"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight group-hover:text-surface-tint transition-colors">
                Visual Designer
              </h3>
              <p className="text-secondary font-medium mt-0.5">
                Stellar Edge •{" "}
                <span className="text-sm text-outline">Hybrid</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_160px_48px] items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Applied on
              </span>
              <span className="text-sm font-semibold text-primary">
                Sep 24, 2023
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline tracking-widest uppercase mb-1">
                Status
              </span>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-bold tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant mr-2"></span>
                  Reviewed
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="p-2 rounded-xl hover:bg-surface-container-low text-primary transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Pagination Placeholder  */}
      <div className="mt-12 flex justify-center">
        <nav className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-on-primary text-sm font-bold">
            1
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors text-sm font-bold">
            2
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors text-sm font-bold">
            3
          </button>
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-primary hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </nav>
      </div>
    </main>
  );
};

export default CandidateApplications;
