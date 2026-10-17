const COLUMNS = [
  {
    title: "Services",
    links: ["Email Marketing", "Campaigns", "Branding", "Offline"],
  },
  { title: "About", links: ["Our Story", "Benefits", "Team", "Careers"] },
  { title: "Follow Us", links: ["Facebook", "Twitter", "Instagram"] },
];

export function LibraryFooter() {
  return (
    <footer className="mt-16 border-t border-[#1c1c26]/10 px-4 pt-12 pb-8 md:px-8">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-4">
          <span className="brand" aria-label="BookOnline">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
          </span>
          <p className="text-sm leading-relaxed text-[#1c1c26]/70">
            Stories worth staying for. Discover new releases, timeless classics,
            and the books readers can&apos;t put down.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="text-sm text-[#1c1c26]/50">{column.title}</h2>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#1c1c26] hover:text-[#0799ea]"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-3 text-xs text-[#1c1c26]/60 sm:flex-row sm:justify-between">
        <p>
          Copyright &copy; {new Date().getFullYear()} BookOnline. All rights
          reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#1c1c26]">
            Terms &amp; Conditions
          </a>
          <a href="#" className="hover:text-[#1c1c26]">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
