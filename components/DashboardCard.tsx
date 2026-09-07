interface DashboardCardProps {
  title: string;
  value: number;
}

export default function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <p className="truncate text-sm text-gray-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </h3>
    </div>
  );
}