"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AnomalyAlert({ transaction, onDismiss }) {
  const severityConfig = {
    high: { color: "destructive", icon: AlertTriangle, label: "High" },
    medium: { color: "default", icon: AlertCircle, label: "Medium" },
  };

  const config = severityConfig[transaction.severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Icon className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold text-orange-900">
                Unusual Transaction Detected
              </CardTitle>
              <CardDescription className="text-orange-700 text-xs mt-1">
                {transaction.anomalyReason}
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-orange-600 hover:text-orange-700 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-orange-800">
        <div className="space-y-2">
          <p><strong>Category:</strong> {transaction.category}</p>
          <p><strong>Amount:</strong> ${transaction.amount}</p>
          {transaction.description && (
            <p><strong>Description:</strong> {transaction.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnomalySummary({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Unusual Transactions ({anomalies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {anomalies.map((transaction) => (
            <div key={transaction.id} className="border-l-2 border-orange-400 pl-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">${transaction.amount}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-orange-50">
                  {transaction.severity === "high" ? "🔴 High" : "⚠️ Medium"}
                </Badge>
              </div>
              {transaction.anomalyReason && (
                <p className="text-xs text-muted-foreground mt-1">
                  {transaction.anomalyReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
