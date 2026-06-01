type TaskCardProps = {
  title: string;
  completed?: boolean;
};

export default function TaskCard({
  title,
  completed,
}: TaskCardProps) {
  return (
    <div className="bg-stone/5 border border-stone/10 p-3.5 rounded-xl flex items-center justify-between hover:bg-stone/8 transition duration-150 shadow-sm shadow-[#24251a]/10">
      <div className="min-w-0 pr-2">
        <h3
          className={`font-semibold text-sm text-stone/90 truncate ${
            completed ? "line-through text-stone/40 font-medium" : ""
          }`}
        >
          {title}
        </h3>
      </div>

      <input 
        type="checkbox" 
        checked={completed} 
        readOnly 
        className="accent-rust w-4 h-4 cursor-pointer shrink-0" 
      />
    </div>
  );
}
