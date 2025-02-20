import { db, ID, Query } from "../../../../lib/appwrite";

// ✅ Fetch a single article by ID or return all articles
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("id");

  if (articleId) {
    try {
      const article = await db.getDocument("help_articles_immo", articleId);
      return Response.json(article);
    } catch (error) {
      return Response.json({ error: "Article not found" }, { status: 404 });
    }
  }

  // Fetch all articles
  const articles = await db.listDocuments("help_articles_immo");
  return Response.json(articles.documents);
}

// ✅ Create a new article
export async function POST(req) {
  const { title, content, category, author } = await req.json();

  const newArticle = await db.createDocument("help_articles_immo", ID.unique(), {
    title,
    content,
    category,
    author,
    createdAt: new Date().toISOString(),
  });

  return Response.json(newArticle);
}