import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-table:text-sm prose-th:text-left">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Tables in the seeded manual content (e.g. lateness penalty
          // grids) are wider than a phone screen — scope the scroll to the
          // table itself rather than letting it blow out the page width.
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
