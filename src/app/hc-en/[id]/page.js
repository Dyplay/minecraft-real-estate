"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // ✅ Enables tables, autolinks, strikethrough, etc.
import remarkBreaks from "remark-breaks"; // ✅ Ensures proper line breaks in markdown
import rehypeRaw from "rehype-raw"; // ✅ Enables rendering raw HTML inside Markdown
import Link from "next/link";
import Skeleton from "../../components/Skeleton";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles?id=${id}`);
        const data = await res.json();
        setArticle(data);
      } catch (error) {
        console.error("🚨 Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  return (
    <div className="container mx-auto p-6">
      {/* 🔹 Breadcrumbs */}
      <nav className="text-sm mb-4">
        <ul className="flex items-center gap-2 text-gray-500">
          <li>
            <Link href="/help" className="hover:underline">Help Center</Link>
          </li>
          <li>/</li>
          {loading ? (
            <Skeleton width="100px" height="16px" className="inline-block" />
          ) : (
            <li>
              <Link href={`/help?category=${encodeURIComponent(article?.category)}`} className="hover:underline">
                {article?.category}
              </Link>
            </li>
          )}
          <li>/</li>
          {loading ? (
            <Skeleton width="150px" height="16px" className="inline-block" />
          ) : (
            <li className="text-gray-700 font-semibold">{article?.title}</li>
          )}
        </ul>
      </nav>

      {/* 🔹 Article Content */}
      {loading ? (
        <>
          <Skeleton width="60%" height="32px" className="mb-2" />
          <Skeleton width="40%" height="20px" className="mb-2" />
          <Skeleton width="30%" height="16px" className="mb-4" />
          <Skeleton width="100%" height="150px" className="mb-4" />
          <Skeleton width="90%" height="16px" className="mb-2" />
          <Skeleton width="85%" height="16px" className="mb-2" />
          <Skeleton width="95%" height="16px" className="mb-2" />
          <Skeleton width="100%" height="16px" className="mb-2" />
          <Skeleton width="60%" height="16px" className="mb-2" />
        </>
      ) : (
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{article?.title}</h1>
          <p className="text-gray-500 text-sm mb-4">
            Category: {article?.category} • Author: {article?.author}
          </p>
          <hr className="mb-4 border-gray-300" />

          {/* ✅ Final Fix: Controlled spacing for markdown */}
          <div className="text-lg leading-7 text-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]} // ✅ Keeps markdown elements working
              rehypePlugins={[rehypeRaw]}
              components={{
                p: ({ node, ...props }) => <p className="mb-3" {...props} />, // ✅ Reduce spacing between paragraphs
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-2 mt-4" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2 mt-3" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3" {...props} />, // ✅ Proper bullet points
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3" {...props} />, // ✅ Numbered lists
                li: ({ node, ...props }) => <li className="mb-1" {...props} />, // ✅ Keeps list spacing tight
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-white my-2" {...props} />
                ), // ✅ Styled blockquotes
                code: ({ node, ...props }) => (
                  <code className="bg-gray-100 text-red-500 px-2 py-1 rounded-md" {...props} />
                ), // ✅ Styled code snippets
              }}
            >
              {article?.content}
            </ReactMarkdown>
          </div>
        </article>
      )}
    </div>
  );
}