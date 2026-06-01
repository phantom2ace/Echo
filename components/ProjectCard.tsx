type ProjectCardProps = {
  title: string;
  progress: number;
  category: string;
  isAbandoned: boolean;
  onDelete: () => void;
  onToggleAbandon: () => void;
  onProgressChange: (progress: number) => void;
};

export default function ProjectCard({ 
  title, 
  progress, 
  category, 
  isAbandoned, 
  onDelete, 
  onToggleAbandon, 
  onProgressChange 
}: ProjectCardProps) {
  return (
    <div className={`p-4 rounded-2xl border ${
      isAbandoned ? "bg-zinc-900/50 border-zinc-700" : "bg-zinc-900 border-zinc-700"
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            {isAbandoned && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Abandoned</span>}
          </div>
          <span className="text-xs text-zinc-500 mt-1 inline-block">Category: {category}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-zinc-500 hover:text-red-400"
        >
          ✕
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-400">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <div></div>
        <div className="flex gap-2">
          {!isAbandoned && (
            <>
              <button
                onClick={() => onProgressChange(Math.min(100, progress + 25))}
                className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded"
              >
                +25%
              </button>
              <button
                onClick={onToggleAbandon}
                className="bg-red-900/50 hover:bg-red-900 text-red-400 px-2 py-1 rounded"
              >
                Abandon
              </button>
            </>
          )}
          {isAbandoned && (
            <button
              onClick={onToggleAbandon}
              className="bg-green-900/50 hover:bg-green-900 text-green-400 px-2 py-1 rounded"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
