const Footer = () => {
  return (
    <footer className="bg-[#f7f9fb] dark:bg-slate-900 border-t border-outline-variant/15 mt-20">
      <div className="max-w-360 mx-auto px-12 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div className="text-2xl font-bold text-white mb-4">JobNest</div>
            <p className="text-secondary text-sm max-w-sm">
              © 2024 JobNest. Curated with Serene Intelligence.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <a
              className="text-secondary text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-secondary text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-secondary text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Cookie Settings
            </a>
            <a
              className="text-secondary text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Accessibility
            </a>
            <a
              className="text-secondary text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
