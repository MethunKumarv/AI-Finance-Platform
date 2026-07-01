"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function SpendingForecast({ forecast }) {
  if (!forecast || !forecast.forecast || forecast.forecast.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Not enough data for forecast</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = forecast.forecast.slice(0, 8).map((item) => ({
    name: item.category.replace(/_/g, " "),
    projected: item.projected,
    confidence: item.confidence,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Forecast ({forecast.period})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Projected</p>
            <p className="text-2xl font-bold">${forecast.totalProjected}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Period</p>
            <p className="text-2xl font-bold">
              {forecast.period === "7d" ? "7 Days" : forecast.period === "30d" ? "30 Days" : "90 Days"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold">{forecast.forecast.length}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900">
            💡 Based on your spending patterns over the last 90 days
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Top Categories</p>
          {chartData.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium capitalize">{item.name}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (item.projected / forecast.totalProjected) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold">${item.projected}</p>
                <p className="text-xs text-muted-foreground">{Math.round(item.confidence)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
