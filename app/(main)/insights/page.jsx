"use client";

import { useState, useEffect } from "react";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { SpendingAnalysis } from "@/components/insights/spending-analysis";
import { HealthScore } from "@/components/insights/health-score";
import { SpendingForecast } from "@/components/insights/forecast";
import { AnomalySummary } from "@/components/insights/anomaly-alert";
import { BudgetRecommendationModal } from "@/components/insights/budget-recommendation-modal";
import { getSpendingAnalysis, getFinancialHealthScore, getSpendingForecast, getAnomalies, getBudgetRecommendations } from "@/actions/insights";

export default function InsightsPage() {
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scoreData, analysisData, forecastData, anomaliesData, recommendationsData] = await Promise.all([
          getFinancialHealthScore(),
          getSpendingAnalysis("30d"),
          getSpendingForecast("30d"),
          getAnomalies(10),
          getBudgetRecommendations(),
        ]);

        setScore(scoreData);
        setAnalysis(analysisData);
        setForecast(forecastData);
        setAnomalies(anomaliesData);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error("Error loading insights:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <BarLoader color="#9333ea" width={100} />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5">
      <div>
        <h1 className="text-5xl font-bold tracking-tight mb-2">Financial Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of your spending patterns and personalized recommendations
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 flex-wrap">
        {["overview", "analysis", "forecast", "anomalies"].map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? "default" : "outline"}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {score && <HealthScore score={score} />}

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Budget Recommendations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered suggestions based on your 90-day spending history
              </p>

              {recommendations && (
                <div className="space-y-3 mb-4">
                  {recommendations.recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.category} className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{rec.category.replace(/_/g, " ")}</span>
                      <span className="font-bold text-green-600">${rec.recommended}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" onClick={() => setShowRecommendationModal(true)}>
                View All Recommendations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Section */}
      {activeSection === "analysis" && (
        <div className="space-y-4">
          {analysis && <SpendingAnalysis analysis={analysis} />}
        </div>
      )}

      {/* Forecast Section */}
      {activeSection === "forecast" && (
        <div className="space-y-4">
          {forecast && <SpendingForecast forecast={forecast} />}
        </div>
      )}

      {/* Anomalies Section */}
      {activeSection === "anomalies" && (
        <div className="space-y-4">
          {anomalies && anomalies.length > 0 ? (
            <AnomalySummary anomalies={anomalies} />
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-700 font-medium">✅ Great news! No unusual transactions detected.</p>
            </div>
          )}
        </div>
      )}

      {/* Budget Recommendation Modal */}
      {recommendations && (
        <BudgetRecommendationModal
          isOpen={showRecommendationModal}
          onClose={() => setShowRecommendationModal(false)}
          recommendations={recommendations}
          onAccept={async (recs) => {
            console.log("Accepted recommendations:", recs);
          }}
        />
      )}
    </div>
  );
}
