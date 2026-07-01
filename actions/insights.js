"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { callOllama } from "@/lib/ai/ollama-client.js";

export async function getSpendingAnalysis(period = "30d") {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  // Ensure user exists in database
  let user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    user = await db.user.create({
      data: { clerkUserId },
    });
  }

  const userId = user.id;

  const cached = await db.insightCache.findUnique({
    where: { userId_type_period: { userId, type: "spending_analysis", period } },
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const now = new Date();
  const daysAgo = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    all: 365 * 10,
  }[period] || 30;

  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const transactions = await db.transaction.findMany({
    where: {
      user: { clerkUserId: userId },
      type: "EXPENSE",
      date: { gte: startDate },
    },
  });

  if (transactions.length === 0) {
    const emptyAnalysis = {
      topCategories: [],
      trends: {},
      insights: "Not enough transaction data for analysis.",
    };

    await db.insightCache.upsert({
      where: { userId_type_period: { userId, type: "spending_analysis", period } },
      update: {
        data: emptyAnalysis,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        userId,
        type: "spending_analysis",
        period,
        data: emptyAnalysis,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return emptyAnalysis;
  }

  const categorySpending = {};
  transactions.forEach((t) => {
    const cat = t.category;
    if (!categorySpending[cat]) {
      categorySpending[cat] = 0;
    }
    categorySpending[cat] += parseFloat(t.amount);
  });

  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amount]) => ({
      category: cat,
      amount: parseFloat(amount.toFixed(2)),
    }));

  const prompt = `Based on this spending data for the past ${period}, provide 2-3 brief, actionable insights:

${topCategories.map((c) => `- ${c.category}: $${c.amount}`).join("\n")}

Total transactions: ${transactions.length}

Keep each insight to one sentence. Focus on patterns and opportunities for savings.`;

  let insights = "No insights available.";
  try {
    insights = await callOllama(prompt);
  } catch (error) {
    console.error("Error generating insights:", error);
  }

  const analysis = {
    topCategories,
    totalSpent: parseFloat(
      topCategories.reduce((sum, c) => sum + c.amount, 0).toFixed(2)
    ),
    transactionCount: transactions.length,
    insights,
    period,
  };

  await db.insightCache.upsert({
    where: { userId_type_period: { userId, type: "spending_analysis", period } },
    update: {
      data: analysis,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    create: {
      userId,
      type: "spending_analysis",
      period,
      data: analysis,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return analysis;
}

export async function getAnomalies(limit = 10) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const anomalies = await db.transaction.findMany({
    where: { user: { clerkUserId: userId }, isAnomalous: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return anomalies;
}

export async function getFinancialHealthScore() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  // Ensure user exists in database
  let user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    user = await db.user.create({
      data: { clerkUserId },
    });
  }

  const userId = user.id;

  const cached = await db.insightCache.findUnique({
    where: { userId_type_period: { userId, type: "health_score", period: "all" } },
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const expenses30d = await db.transaction.aggregate({
    where: {
      user: { clerkUserId: userId },
      type: "EXPENSE",
      date: { gte: thirtyDaysAgo },
    },
    _sum: { amount: true },
  });

  const income30d = await db.transaction.aggregate({
    where: {
      user: { clerkUserId: userId },
      type: "INCOME",
      date: { gte: thirtyDaysAgo },
    },
    _sum: { amount: true },
  });

  const totalExpenses = parseFloat(expenses30d._sum.amount || 0);
  const totalIncome = parseFloat(income30d._sum.amount || 0);

  let score = 50;
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    score = Math.min(100, 30 + Math.max(0, savingsRate * 0.7));
  }

  const anomalyCount = await db.transaction.count({
    where: { user: { clerkUserId: userId }, isAnomalous: true, date: { gte: ninetyDaysAgo } },
  });

  if (anomalyCount > 5) {
    score = Math.max(20, score - 10);
  }

  const healthScore = {
    score: Math.round(score),
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
    avgExpense: totalExpenses > 0 ? Math.round(totalExpenses / 30) : 0,
    anomalyCount,
  };

  await db.insightCache.upsert({
    where: { userId_type_period: { userId, type: "health_score", period: "all" } },
    update: {
      data: healthScore,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    create: {
      userId,
      type: "health_score",
      period: "all",
      data: healthScore,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return healthScore;
}

export async function getBudgetRecommendations() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const expenses = await db.transaction.findMany({
    where: {
      user: { clerkUserId: userId },
      type: "EXPENSE",
      date: { gte: ninetyDaysAgo },
    },
  });

  const categorySpending = {};
  expenses.forEach((t) => {
    if (!categorySpending[t.category]) categorySpending[t.category] = [];
    categorySpending[t.category].push(parseFloat(t.amount));
  });

  const recommendations = Object.entries(categorySpending)
    .map(([category, amounts]) => {
      const median =
        amounts.length > 0
          ? amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)]
          : 0;
      const recommended = Math.round(median * 1.2);

      return {
        category,
        recommended,
        current: Math.round(amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1)),
        transactions: amounts.length,
      };
    })
    .sort((a, b) => b.current - a.current)
    .slice(0, 10);

  const prompt = `Based on these spending patterns across 90 days, provide 2-3 actionable budget recommendations:

${recommendations.map((r) => `${r.category}: $${r.current}/month average, recommend $${r.recommended}`).join("\n")}

Be concise, friendly, and actionable. Keep each recommendation to one sentence.`;

  let narrativeRecommendations = "";
  try {
    narrativeRecommendations = await callOllama(prompt);
  } catch (error) {
    console.error("Error generating recommendations:", error);
  }

  return {
    recommendations,
    narrative: narrativeRecommendations,
    period: "90d",
  };
}

export async function getSpendingForecast(period = "30d") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const transactions = await db.transaction.findMany({
    where: {
      user: { clerkUserId: userId },
      type: "EXPENSE",
      date: { gte: ninetyDaysAgo },
    },
  });

  const categorySpending = {};
  transactions.forEach((t) => {
    if (!categorySpending[t.category]) categorySpending[t.category] = [];
    categorySpending[t.category].push(parseFloat(t.amount));
  });

  const forecast = Object.entries(categorySpending)
    .map(([category, amounts]) => {
      const avgDaily =
        amounts.reduce((a, b) => a + b, 0) / 90;
      const daysInPeriod = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const projected = Math.round(avgDaily * daysInPeriod);

      return {
        category,
        projected,
        confidence: Math.min(95, Math.max(60, 70 + Math.random() * 20)),
      };
    })
    .sort((a, b) => b.projected - a.projected);

  return {
    forecast,
    period,
    totalProjected: forecast.reduce((sum, f) => sum + f.projected, 0),
  };
}
