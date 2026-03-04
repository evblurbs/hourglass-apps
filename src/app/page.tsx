import AppCard from "@/components/AppCard";
import SubscribeForm from "@/components/SubscribeForm";

const apps = [
  {
    name: "Example App",
    description: "A placeholder for your first app. Replace this with your real apps.",
    status: "coming soon" as const,
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">
          Hourglass Apps
        </h1>
        <p className="max-w-lg text-zinc-600 dark:text-zinc-400">
          Apps built to make the most of your time. Here&apos;s what I&apos;m working on.
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
