import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-gray-700">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-semibold text-gray-900 mt-3 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold text-gray-900 mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-medium text-gray-800 mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 space-y-0.5 text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-0.5 text-gray-700">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-teal-400 pl-3 my-2 text-gray-500 italic bg-teal-50 py-1 rounded-r">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-gray-200 my-3" />,
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className)
    if (isBlock) {
      return (
        <code className={`font-mono text-xs text-teal-700 ${className}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="font-mono text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto bg-gray-50 border border-gray-200 rounded-xl p-3 my-2 text-xs leading-relaxed">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-600 hover:text-teal-500 underline underline-offset-2"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-gray-200 bg-gray-50">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-gray-100 last:border-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-1.5 font-medium text-gray-600">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 text-gray-700">{children}</td>
  ),
}

const rehypePlugins = [[rehypeKatex, { throwOnError: false, strict: false }]]
const remarkPlugins = [remarkGfm, remarkMath]

export default function MarkdownContent({ content }) {
  return (
    <div className="text-sm text-gray-700 math-content">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
