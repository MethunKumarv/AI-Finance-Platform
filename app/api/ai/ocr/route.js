import { auth } from "@clerk/nextjs/server";
import { callOllamaVision } from "@/lib/ai/ollama-client.js";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const prompt = `Extract information from this receipt image. Return ONLY a JSON object with these fields:
- amount: The total amount (number only, e.g., 25.50)
- merchant: The store/restaurant name
- date: The transaction date in YYYY-MM-DD format (if visible, otherwise today's date in that format)
- category: Most likely expense category from this list: dining, groceries, shopping, transportation, utilities, healthcare, entertainment, gas, clothing, other_expense
- description: Brief description of what was purchased (max 50 chars)

Return only the JSON, nothing else.
Example: {"amount": 45.99, "merchant": "Whole Foods", "date": "2025-05-15", "category": "groceries", "description": "Weekly groceries"}`;

    const result = await callOllamaVision(base64, prompt, "llava");

    const jsonMatch = result.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);

      if (!extracted.amount || !extracted.merchant || !extracted.category) {
        throw new Error("Could not extract required information from receipt");
      }

      extracted.amount = parseFloat(extracted.amount);

      // Set date to today if not provided
      if (!extracted.date) {
        const today = new Date();
        extracted.date = today.toISOString().split('T')[0];
      }

      return Response.json(extracted);
    }

    throw new Error("Failed to parse receipt");
  } catch (error) {
    console.error("OCR error:", error);
    return Response.json(
      { error: error.message || "Failed to process receipt" },
      { status: 500 }
    );
  }
}
