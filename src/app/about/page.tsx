import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "About - Hourglass Apps",
  description: "Learn about Hourglass Apps and our mission.",
};

export default function About() {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">About</h1>
        <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>
            Hourglass Apps builds tools that help you make the most of your
            time. We believe the best software solves a specific problem simply
            and effectively.
          </p>
          <p>
            We&apos;re a small team focused on shipping useful apps. Every app
            we build starts with a real problem we&apos;ve experienced
            ourselves.
          </p>
        </div>
      </section>
    </div>
  );
}
