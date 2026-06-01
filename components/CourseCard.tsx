type CourseCardProps = {
  name: string;
  progress: number;
  examDate?: string;
  confidence: number;
  onDelete?: () => void;
  onProgressChange: (progress: number) => void;
};

export default function CourseCard({
  name,
  progress,
  examDate,
  confidence,
  onDelete,
  onProgressChange,
}: CourseCardProps) {
  const getConfidenceLevel = (conf: number): "low" | "medium" | "high" => {
    if (conf < 34) return "low";
    if (conf < 67) return "medium";
    return "high";
  };
  
  const confidenceLevel = getConfidenceLevel(confidence);
  
  const confidenceColors = {
    low: "text-red-400 bg-red-900/30",
    medium: "text-yellow-400 bg-yellow-900/30",
    high: "text-green-400 bg-green-900/30",
  };

  return (
    <div className="bg-zinc-900 p-4 rounded-2xl">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          {examDate && (
            <p className="text-sm text-zinc-400 mt-1">Exam: {new Date(examDate).toLocaleDateString()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${confidenceColors[confidenceLevel]}`}>
            {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence ({confidence}%)
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-400">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              onClick={() => onProgressChange(p)}
              className="flex-1 text-xs py-1 rounded bg-zinc-800 hover:bg-zinc-700"
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
