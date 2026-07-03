import type { ReactNode } from "react";

export function SiteHeader({
  sticky = false,
  right,
}: {
  sticky?: boolean;
  right?: ReactNode;
}) {
  return (
    <nav className={`${sticky ? "sticky top-0 z-50 " : ""}w-full backdrop-blur-md bg-[#0b0e14]/95 border-b border-white/5`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">

        <a href="https://www.differentialfactor.com" aria-label="Differential Factor home" className="flex items-center gap-4 hover:opacity-90 transition group">
          <img src="/images/logo-mark.png" alt="DF Icon" className="h-8 w-auto object-contain" />
          <span className="text-sm md:text-base font-bold tracking-[0.25em] text-white uppercase font-display hidden sm:block">
            DIFFERENTIAL<span className="text-[#00c896] group-hover:text-[#7075db] transition">FACTOR</span>
          </span>
        </a>

        <div className="flex items-center gap-6 md:gap-10 text-sm font-medium">
          <a href="https://www.differentialfactor.com/about" className="text-[#d1d5db] hover:text-white transition tracking-wide hidden md:block">About</a>
          <a href="https://www.differentialfactor.com/custom-research" className="text-[#d1d5db] hover:text-white transition tracking-wide hidden md:block">Custom Research</a>
          <a href="https://differentialfactor.substack.com" target="_blank" rel="noopener noreferrer" className="text-[#d1d5db] hover:text-white transition tracking-wide hidden md:block">Substack</a>
          <a href="https://www.differentialfactor.com/contact" className="bg-[#00c896] text-[#0b0e14] px-6 py-2.5 rounded-full hover:brightness-110 transition font-bold text-xs md:text-sm whitespace-nowrap">
            Contact
          </a>
          {right && <div className="flex items-center gap-4">{right}</div>}
        </div>

      </div>
    </nav>
  );
}
