"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, X } from "lucide-react";

export function BudgetRecommendationModal({ isOpen, onClose, recommendations, onAccept }) {
  const [accepting, setAccepting] = useState(false);

  if (!isOpen || !recommendations || !recommendations.recommendations) {
    return null;
  }

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(recommendations.recommendations);
    } finally {
      setAccepting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">AI Budget Recommendations</h2>
              <p className="text-sm text-muted-foreground">
                Based on your spending over 90 days, we recommend these monthly budgets
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {recommendations.narrative && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Recommendations</p>
              <p className="text-sm text-blue-800">{recommendations.narrative}</p>
            </div>
          )}

          <div className="space-y-3">
            {recommendations.recommendations.map((rec) => (
              <div key={rec.category} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold capitalize">{rec.category.replace(/_/g, " ")}</h4>
                  <span className="text-2xl font-bold text-green-600">${rec.recommended}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Current Average</p>
                    <p className="font-medium">${rec.current}/month</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Transactions</p>
                    <p className="font-medium">{rec.transactions}</p>
                  </div>
                </div>

                {rec.recommended < rec.current && (
                  <p className="text-xs text-orange-600">
                    💡 Opportunity to save ~${rec.current - rec.recommended}/month
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={accepting} className="flex-1">
              Dismiss
            </Button>
            <Button onClick={handleAccept} disabled={accepting} className="flex-1">
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Recommendations"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
