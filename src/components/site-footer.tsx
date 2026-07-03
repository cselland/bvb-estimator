import Link from "next/link";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`bg-[#0b0e14] border-t border-[#00c896] pt-16 pb-10 ${className}`.trim()}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">

        <div className="flex flex-col md:flex-row items-center gap-8">
          <img src="/images/logo-mark.png" alt="DF Icon" className="h-9 md:h-10 w-auto shrink-0 object-contain" />
          <p className="text-[#00c896] text-base md:text-lg font-semibold tracking-wide text-center md:text-left max-w-sm leading-snug">
            Analyzing the disruption of the AI-native economy.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 text-slate-300">
          <div className="flex items-center gap-5">
            <a href="https://www.linkedin.com/company/differential-factor/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-[#00c896] transition" aria-label="Differential Factor on LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://x.com/diff_factor" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-[#00c896] transition" aria-label="Differential Factor on X">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://bsky.app/profile/differentialfactor.bsky.social" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-[#00c896] transition" aria-label="Differential Factor on Bluesky">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.686 6.383 3.247.176-.03.356-.062.539-.096-.394.63-1.28 1.305-1.28 1.305s.009 0 .01.002l.07.077c.1.107.31.322.55.518.24.196.58.406.98.58.82.352 2.02.47 3.11.16.22-.059.44-.135.66-.237.34-.147.73-.35.73-.35s-.91-.677-1.31-1.24c-.13-.17-.24-.34-.32-.5l.43-.15c3.16-1.08 5.46-3.25 6.27-6.28.25-.99.62-5.8.62-6.49 0-.69-.14-1.86-.9-2.2-.66-.3-1.67-.62-4.3 2.43-2.75 1.94-5.69 7.04-6.4 7.86-.7-.82-3.64-5.92-6.4-7.86-2.63-3.05-3.64-2.73-4.3-2.43-.76.34-.9 1.51-.9 2.2 0 .69.37 5.5.62 6.49.81 3.03 3.11 5.2 6.27 6.28l.43.15c-.08.16-.19.33-.32.5-.4.56-1.31 1.24-1.31 1.24s.39.2.73.35c.22.1.44.18.66.24 1.09.31 2.29.19 3.11-.16.4-.17.74-.38.98-.58.24-.2.45-.41.55-.52l.07-.08s.01-.002.01-.002s-.89-.67-1.28-1.3c.18.03.36.07.54.096 2.67.44 5.57-.51 6.38-3.247.25-.83.62-5.79.62-6.479 0-.69-.14-1.86-.9-2.2-.66-.3-1.67-.62-4.3 2.43z"/></svg>
            </a>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em]">© {new Date().getFullYear()} Differential Factor LLC</p>
          <p className="text-[9px] uppercase tracking-widest font-bold">Plymouth, Massachusetts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10 pt-8 border-t border-slate-200/10">
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-slate-600" aria-label="Legal">
          <Link href="/legal/terms" className="hover:text-[#00c896] underline-offset-4 hover:underline transition">Terms of Use</Link>
          <Link href="/legal/privacy" className="hover:text-[#00c896] underline-offset-4 hover:underline transition">Privacy Policy</Link>
        </nav>
      </div>
    </footer>
  );
}
