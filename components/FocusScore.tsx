type FocusScoreProps = {
  score: number;
};

export default function FocusScore({ score }: FocusScoreProps) {
  const getStatusColor = () => {
    if (score >= 70) return "text-sage bg-sage/5 border-sage/30";
    if (score >= 40) return "text-stone bg-stone/5 border-stone/20";
    return "text-rust bg-rust/5 border-rust/30";
  };

  const getStatusText = () => {
    if (score >= 70) return "Doing Great! 🌟";
    if (score >= 40) return "Keep Going! 📈";
    return "Let's Reset! 🔄";
  };

  return (
    <div className={`p-6 rounded-2xl border ${getStatusColor()}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-bold tracking-tight">Focus Score</h3>
        <span className="text-3xl font-extrabold tracking-tight">{score}%</span>
      </div>
      <div className="w-full h-2.5 bg-earth/60 rounded-full overflow-hidden mb-3 border border-stone/5">
        <div 
          className={`h-full transition-all duration-500 rounded-full ${
            score >= 70 ? "bg-sage" :
            score >= 40 ? "bg-stone" : "bg-rust"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs font-semibold text-stone/75">{getStatusText()}</p>
    </div>
  );
}
