import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-df-paper text-df-body">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
