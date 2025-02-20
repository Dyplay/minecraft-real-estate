"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Skeleton from "../../components/Skeleton";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      const res = await fetch(`/api/articles?id=${id}`);
      const data = await res.json();
      setArticle(data);
      setLoading(false);
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
              <Link href={`/help?category=${encodeURIComponent(article.category)}`} className="hover:underline">
                {article.category}
              </Link>
            </li>
          )}
          <li>/</li>
          {loading ? (
            <Skeleton width="150px" height="16px" className="inline-block" />
          ) : (
            <li className="text-gray-700 font-semibold">{article.title}</li>
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
        <>
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <p className="text-gray-500">Category: {article.category}</p>
          <p className="text-gray-500">Author: {article.author}</p>
          <hr className="my-4" />
          <ReactMarkdown className="prose">{article.content}</ReactMarkdown>
        </>
      )}
    </div>
  );
}