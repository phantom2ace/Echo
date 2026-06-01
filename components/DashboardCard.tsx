interface DashboardCardProps {
  title: string;
  description: string;
}

export default function DashboardCard({ title, description }: DashboardCardProps) {
  return (
    <div className="bg-zinc-900 p-4 rounded-2xl">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-zinc-400 mt-2">{description}</p>
    </div>
  );
}
