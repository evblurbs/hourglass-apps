import AppCard from "@/components/AppCard";
import SubscribeForm from "@/components/SubscribeForm";

const apps = [
  {
    name: "Simple Budget",
    description:
      "A personal budgeting app for tracking expenses, income, and recurring costs with a visual dashboard.",
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
    <div className="space-y-12">
      <section>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          Hourglass Apps
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Apps built to make the most of your time. Here&apos;s what we&apos;re working on.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Apps</h2>
        <div className="grid gap-4">
          {apps.map((app) => (
            <AppCard key={app.name} {...app} />
          ))}
        </div>
      </section>

      <section>
        <SubscribeForm />
      </section>
    </div>
  );
}
