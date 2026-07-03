import type { Components } from "react-markdown";

/** Shared typography for long-form Markdown (reports, legal pages). */
export const markdownDocComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-black text-df-ink mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-df-ink mt-7 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-df-ink mt-6 mb-2">{children}</h3>,
  p: ({ children }) => <p className="mb-3 text-slate-700">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-outside list-disc space-y-2 pl-6 [list-style-type:disc]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-outside list-decimal space-y-2 pl-6 [list-style-type:decimal]">{children}</ol>
  ),
  li: ({ children }) => <li className="text-slate-700 pl-0.5">{children}</li>,
  table: ({ children }) => (
    <table className="w-full border-collapse border border-df-line text-sm my-4">{children}</table>
  ),
  thead: ({ children }) => <thead className="bg-df-canvas">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-df-line px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-df-line px-3 py-2 align-top">{children}</td>,
  strong: ({ children }) => <strong className="font-bold text-df-ink">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} className="text-df-iris underline hover:opacity-80 break-words">
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-df-line" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-df-mint/50 pl-4 my-4 text-slate-600 italic">{children}</blockquote>
  ),
};
