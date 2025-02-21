import { db, ID, Query } from "../../../../lib/appwrite";



export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("id");

    console.log("🔍 Fetching Articles...");
    console.log("🆔 Requested Article ID:", articleId);

    if (articleId) {
      try {
        const databaseId = "67a8e81100361d527692"; // 🔥 Your actual database ID
        const collectionId = "help_articles_immo"; // 🔥 Your collection ID

        const article = await db.getDocument(databaseId, collectionId, articleId);
        console.log("✅ Article Found:", article);
        return Response.json(article);
      } catch (error) {
        console.error("🚨 Error fetching article:", error);
        return Response.json({ error: "Article not found" }, { status: 404 });
      }
    }

    // 🔥 Fetch all articles (Fix for pagination)
    const databaseId = "67a8e81100361d527692"; // ✅ Use database ID
    const collectionId = "help_articles_immo";

    const articles = await db.listDocuments(databaseId, collectionId, [], 100);
    console.log("✅ All Articles:", articles.documents);

    return Response.json(articles.documents);
  } catch (error) {
    console.error("🚨 General API Error:", error);
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

// ✅ Create a new article
export async function POST(req) {
  try {
    const { title, content, category, author } = await req.json();

    // 🔥 Ensure all required fields are provided
    if (!title || !content || !category || !author) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Correct Appwrite function call (Provide Database ID, Collection ID, Data Object)
    const newArticle = await db.createDocument(
      "67a8e81100361d527692",  // 🔹 Database ID (Replace with your actual DB ID)
      "help_articles_immo",    // 🔹 Collection ID
      ID.unique(),             // 🔹 Unique Document ID
      {
        title,
        content,
        category,
        author,
        createdAt: new Date().toISOString(),
      }
    );

    return Response.json(newArticle);
  } catch (error) {
    console.error("🚨 Error creating article:", error);
    return Response.json({ error: "Failed to create article" }, { status: 500 });
  }
}