"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function SpendingAnalysis({ analysis }) {
  if (!analysis || !analysis.topCategories || analysis.topCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Not enough data for analysis</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = analysis.topCategories.map((cat) => ({
    name: cat.category.replace(/_/g, " ").toUpperCase(),
    amount: cat.amount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category ({analysis.period})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="amount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">${analysis.totalSpent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{analysis.transactionCount}</p>
          </div>
        </div>

        {analysis.insights && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">AI Insights</p>
            <p className="text-xs text-blue-800 whitespace-pre-wrap">{analysis.insights}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
