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
    <article className="max-w-df-canvas mx-auto px-8 md:px-df-inset pt-[92px] pb-16">
      <div className="df-measure-body overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
          {termsOfUseMarkdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}
