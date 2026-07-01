import { callOllama } from "./ollama-client.js";

const CATEGORY_OPTIONS = {
  INCOME: [
    "salary",
    "freelance",
    "business",
    "investments",
    "gifts",
    "other_income",
  ],
  EXPENSE: [
    "housing",
    "transportation",
    "food",
    "utilities",
    "healthcare",
    "entertainment",
    "shopping",
    "education",
    "personal",
    "travel",
    "insurance",
    "debt",
    "savings",
    "groceries",
    "dining",
    "gas",
    "clothing",
    "gym",
    "phone",
    "internet",
    "streaming",
    "hobbies",
    "gifts_donations",
    "pets",
    "home_improvement",
    "childcare",
    "other_expense",
  ],
};

export async function predictCategory(
  description,
  amount,
  transactionType,
  historicalCategories = []
) {
  if (!description || description.trim().length === 0) {
    return { category: null, confidence: 0 };
  }

  const categories =
    CATEGORY_OPTIONS[transactionType] || CATEGORY_OPTIONS.EXPENSE;
  const categoryList = categories.join(", ");

  const historicalContext =
    historicalCategories.length > 0
      ? `\nUser's historically used categories: ${historicalCategories.slice(0, 5).join(", ")}`
      : "";

  const prompt = `You are a financial transaction categorizer. Analyze this transaction and predict the most appropriate category.

Transaction Details:
- Description: "${description}"
- Amount: $${amount}
- Type: ${transactionType}

Available categories: ${categoryList}${historicalContext}

Return ONLY a valid JSON object with two fields:
1. "category": one of the available categories (must be exact match)
2. "confidence": a number between 0 and 1 representing how confident you are

Example response: {"category": "dining", "confidence": 0.95}`;

  try {
    const result = await callOllama(prompt);

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      if (categories.includes(parsedResult.category)) {
        return {
          category: parsedResult.category,
          confidence: Math.min(1, Math.max(0, parsedResult.confidence || 0)),
        };
      }
    }
  } catch (error) {
    console.error("Error categorizing transaction:", error);
  }

  return { category: null, confidence: 0 };
}

export async function explainCategory(category, amount, description) {
  const prompt = `Explain briefly why this transaction would be categorized as "${category}":
Transaction: "${description}" for $${amount}
Keep explanation to one sentence.`;

  try {
    const result = await callOllama(prompt);
    return result.trim();
  } catch (error) {
    console.error("Error explaining category:", error);
    return "";
  }
}
