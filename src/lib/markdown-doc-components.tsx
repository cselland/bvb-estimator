import type { Components } from "react-markdown";

/**
 * Shared typography for long-form Markdown (reports, legal pages).
 * Headlines Archivo, running text Spectral, data/labels mono — spec §2.
 */
export const markdownDocComponents: Components = {
  h1: ({ children }) => <h1 className="df-h3 mb-5">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="df-h2 mt-10 mb-4 pb-3 border-b border-df-ink">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="df-h4 mt-8 mb-3">{children}</h3>,
  p: ({ children }) => <p className="df-dek mb-4">{children}</p>,
  ul: ({ children }) => (
    <ul className="df-dek mb-4 list-outside list-disc space-y-2 pl-6 [list-style-type:disc]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="df-dek mb-4 list-outside list-decimal space-y-2 pl-6 [list-style-type:decimal]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  table: ({ children }) => (
    <table className="w-full border-collapse border border-df-hairline my-5">{children}</table>
  ),
  thead: ({ children }) => <thead className="bg-df-panel">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-df-hairline px-3 py-2 text-left df-eyebrow text-df-ink">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-df-hairline px-3 py-2 align-top df-dek">{children}</td>
  ),
  strong: ({ children }) => <strong className="font-semibold text-df-ink">{children}</strong>,
  code: ({ children }) => <code className="df-mono text-[0.9em] text-df-ink">{children}</code>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="df-link underline underline-offset-[3px] decoration-1 break-words"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-df-hairline" />,
  blockquote: ({ children }) => (
    <blockquote className="bg-df-panel border-l-8 border-df-oxblood pl-5 py-4 my-5">
      {children}
    </blockquote>
  ),
};
