import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { privacyPolicyMarkdown } from "@/lib/legal-docs";
import { markdownDocComponents } from "@/lib/markdown-doc-components";

export const metadata: Metadata = {
  title: "Privacy Policy | Build vs. Buy Calculator",
  description: "Privacy Policy for Differential Factor services, including the Build vs. Buy calculator.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-10 md:py-14">
      <div className="max-w-none text-sm leading-relaxed text-slate-700 overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
          {privacyPolicyMarkdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}
