import { Globe } from "lucide-react";

export function BrandHeader() {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="UsePagely home">
        <span className="brand-mark" aria-hidden="true">
          <span />
        </span>
        <span>UsePagely</span>
      </a>
      <button
        className="language-switcher"
        type="button"
        aria-label="Language: English"
      >
        <Globe aria-hidden="true" />
        <span>EN</span>
        <span className="flag" aria-hidden="true">
          🇬🇧
        </span>
      </button>
    </header>
  );
}
