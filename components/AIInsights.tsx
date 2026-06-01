import type { AIInsight } from "@/lib/types";

type AIInsightsProps = {
  insights: AIInsight[];
};

export default function AIInsights({ insights }: AIInsightsProps) {
  const getTypeStyles = (type: AIInsight["type"]) => {
    if (type === "positive") {
      return {
        borderClass: "border-l-4 border-l-sage border-y-stone/10 border-r-stone/10",
        bgClass: "bg-sage/5",
        icon: "💪"
      };
    }
    if (type === "warning") {
      return {
        borderClass: "border-l-4 border-l-rust border-y-stone/10 border-r-stone/10",
        bgClass: "bg-rust/5",
        icon: "⚠️"
      };
    }
    return {
      borderClass: "border-l-4 border-l-stone border-y-stone/10 border-r-stone/10",
      bgClass: "bg-stone/5",
      icon: "💡"
    };
  };

  return (
    <div className="space-y-3">
      {insights.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-stone/10 rounded-xl text-stone/40 bg-earth/20">
          <p className="text-xs">Keep using the app to get insights! 🧠</p>
        </div>
      ) : (
        insights.map(insight => {
          const styles = getTypeStyles(insight.type);
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border bg-earth/30 hover:bg-stone/5 transition-all duration-200 ${styles.borderClass} ${styles.bgClass} shadow-sm shadow-[#24251a]/10`}
            >
              <div className="flex gap-3">
                <span className="text-base shrink-0 select-none leading-none">{styles.icon}</span>
                <p className="text-xs text-stone/85 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
