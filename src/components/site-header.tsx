import type { ReactNode } from "react";

/**
 * Header (spec §5) — Paper ground, 24/80px padding, 1px Ink bottom rule.
 * Contained mark 34px + wordmark Archivo 700 21px. Nav in Spectral 400 17px,
 * Ink with an Oxblood hover.
 */
export function SiteHeader({
  sticky = false,
  right,
}: {
  sticky?: boolean;
  right?: ReactNode;
}) {
  return (
    <nav
      className={`${sticky ? "sticky top-0 z-50 " : ""}w-full bg-df-paper border-b border-df-ink`}
    >
      <div className="max-w-df-canvas mx-auto px-8 md:px-df-inset py-6 flex justify-between items-center gap-8">
        <a
          href="https://www.differentialfactor.com"
          aria-label="Differential Factor home"
          className="flex items-center gap-4 group shrink-0"
        >
          <img
            src="/brand/df-mark-contained-oxblood.svg"
            alt=""
            aria-hidden="true"
            width={34}
            height={34}
            className="h-[34px] w-[34px] shrink-0"
          />
          <span className="df-wordmark text-[21px] leading-none text-df-ink group-hover:text-df-oxblood transition-colors duration-df ease-df hidden sm:block">
            Differential Factor
          </span>
        </a>

        <div className="flex items-center gap-6 md:gap-9 font-body text-[17px]">
          <a
            href="https://www.differentialfactor.com/about"
            className="df-link hidden md:block"
          >
            About
          </a>
          <a
            href="https://research.differentialfactor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="df-link hidden md:block"
          >
            Research
          </a>
          <a href="https://www.differentialfactor.com/contact" className="df-btn">
            Contact
          </a>
          {right && <div className="flex items-center gap-4">{right}</div>}
        </div>
      </div>
    </nav>
  );
}
