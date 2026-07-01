import { predictCategory } from "@/lib/ai/categorization";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, amount, type } = await request.json();

    if (!description || !amount || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's historical categories for context
    const historicalTransactions = await db.transaction.findMany({
      where: { user: { clerkUserId: userId } },
      select: { category: true },
      distinct: ["category"],
      take: 10,
    });

    const historicalCategories = historicalTransactions.map(
      (t) => t.category
    );

    const result = await predictCategory(
      description,
      amount,
      type,
      historicalCategories
    );

    // Store the categorization attempt for ML feedback
    if (result.category && result.confidence > 0) {
      await db.aICategory.create({
        data: {
          userId,
          description,
          predictedCategory: result.category,
          confidence: result.confidence,
          feedback: false,
        },
      });
    }

    return Response.json(result);
  } catch (error) {
    console.error("Categorization API error:", error);
    return Response.json(
      { error: "Failed to categorize transaction" },
      { status: 500 }
    );
  }
}
