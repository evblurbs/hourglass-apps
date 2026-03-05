import AppCard from "@/components/AppCard";

const apps = [
  {
    name: "Simple Budget",
    description:
      "A personal budgeting app built around manual transaction entry — no bank connections, just purposeful recording that keeps you aware of every dollar.",
    status: "beta" as const,
  },
  {
    name: "10YC",
    description:
      "A mobile app for rating and reviewing meals under $10 with location-based discovery and restaurant search.",
    status: "beta" as const,
  },
  {
    name: "FlipLink",
    description:
      "A smart redirection platform with physical QR code products that can be claimed and pointed to any URL.",
    status: "beta" as const,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col space-y-12">
      <section>
        <p className="text-zinc-600 dark:text-zinc-400">
          We build apps we love to use, with an emphasis on community and personal connection. Here&apos;s what we&apos;re working on.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Projects</h2>
        <div className="grid gap-4">
          {apps.map((app) => (
            <AppCard key={app.name} {...app} />
          ))}
        </div>
      </section>
    </div>
  );
}
