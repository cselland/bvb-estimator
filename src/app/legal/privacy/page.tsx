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
    <article className="max-w-df-canvas mx-auto px-8 md:px-df-inset pt-[92px] pb-16">
      <div className="df-measure-body overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownDocComponents}>
          {privacyPolicyMarkdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}
