import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { termsOfUseMarkdown } from "@/lib/legal-docs";
import { markdownDocComponents } from "@/lib/markdown-doc-components";

export const metadata: Metadata = {
  title: "Terms of Use | Build vs. Buy Calculator",
  description: "Terms of Use for the Differential Factor Build vs. Buy calculator.",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <div className="max-w-none text-sm leading-relaxed text-slate-700 overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
          {termsOfUseMarkdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}
