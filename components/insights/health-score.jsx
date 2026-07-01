"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HealthScore({ score }) {
  const getScoreColor = (value) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-blue-600";
    if (value >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (value) => {
    if (value >= 80) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(score.score)}`}>
            {score.score}
            <span className="text-2xl">/100</span>
          </div>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            {getScoreLabel(score.score)}
          </p>
        </div>

        <Progress value={score.score} className="h-3" />

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Savings Rate</p>
            <p className="text-xl font-bold">{score.savingsRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Avg Daily Spend</p>
            <p className="text-xl font-bold">${score.avgExpense}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Anomalies</p>
            <p className="text-xl font-bold">{score.anomalyCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
