import { callOllama } from "./ollama-client.js";

export async function detectAnomalies(userTransactions, newTransaction) {
  if (!userTransactions || userTransactions.length === 0) {
    return { isAnomalous: false, reason: "" };
  }

  const categoryStats = {};
  userTransactions.forEach((t) => {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = [];
    }
    categoryStats[t.category].push(parseFloat(t.amount));
  });

  const categoryTransactions = categoryStats[newTransaction.category] || [];

  if (categoryTransactions.length < 3) {
    return { isAnomalous: false, reason: "" };
  }

  const mean =
    categoryTransactions.reduce((a, b) => a + b, 0) /
    categoryTransactions.length;
  const variance =
    categoryTransactions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    categoryTransactions.length;
  const stdDev = Math.sqrt(variance);

  const newAmount = parseFloat(newTransaction.amount);
  const zScore = stdDev > 0 ? Math.abs(newAmount - mean) / stdDev : 0;

  if (zScore > 2) {
    const explanation = await explainAnomaly(newTransaction, mean, stdDev, zScore);
    return {
      isAnomalous: true,
      reason: explanation,
      severity: zScore > 3 ? "high" : "medium",
    };
  }

  const lastTransactionDate = new Date(
    Math.max(...userTransactions.map((t) => new Date(t.date)))
  );
  const daysSinceLastTx = Math.floor(
    (new Date() - lastTransactionDate) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastTx > 60 && newAmount > mean * 1.5) {
    const explanation = await explainAnomaly(newTransaction, mean, stdDev, 1.5);
    return {
      isAnomalous: true,
      reason: `Unusual transaction after ${daysSinceLastTx} days: ${explanation}`,
      severity: "medium",
    };
  }

  return { isAnomalous: false, reason: "" };
}

export async function explainAnomaly(
  transaction,
  categoryMean,
  categoryStdDev,
  deviation
) {
  const prompt = `Explain why this transaction might be considered unusual:

Transaction:
- Category: ${transaction.category}
- Amount: $${transaction.amount}
- Description: ${transaction.description || "No description"}
- Category average: $${categoryMean.toFixed(2)}
- Deviation factor: ${deviation.toFixed(1)}x from normal

Provide a brief, friendly explanation (one sentence) of why this stands out.`;

  try {
    const result = await callOllama(prompt);
    return result.trim() || "This transaction seems unusual for your spending pattern.";
  } catch (error) {
    console.error("Error explaining anomaly:", error);
    return "This transaction seems unusual for your spending pattern.";
  }
}

export function calculateAnomalySummary(transactions) {
  const anomalies = transactions.filter((t) => t.isAnomalous);
  const total = transactions.length;

  return {
    count: anomalies.length,
    percentage: total > 0 ? ((anomalies.length / total) * 100).toFixed(1) : 0,
    anomalies: anomalies.slice(0, 10),
  };
}
