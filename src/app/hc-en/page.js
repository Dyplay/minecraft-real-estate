"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HelpCenter() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function fetchArticles() {
      const res = await fetch("/api/articles");
      const data = await res.json();
      setArticles(data);
    }
    fetchArticles();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Help Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link key={article.$id} href={`/help/${article.$id}`} className="card">
            <div className="card-body">
              <h2 className="card-title">{article.title}</h2>
              <p className="text-gray-500">{article.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}