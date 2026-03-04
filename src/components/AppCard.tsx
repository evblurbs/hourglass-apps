interface AppCardProps {
  name: string;
  description: string;
  status: "live" | "beta" | "coming soon";
  url?: string;
}

const statusStyles = {
  live: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  beta: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "coming soon": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function AppCard({ name, description, status, url }: AppCardProps) {
  const Wrapper = url ? "a" : "div";
  const wrapperProps = url
    ? { href: url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="block rounded-lg border border-black/[.08] p-5 transition-colors hover:border-black/[.15] dark:border-white/[.1] dark:hover:border-white/[.2]"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </Wrapper>
  );
}
