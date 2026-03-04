import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team - Hourglass Apps",
  description: "Meet the team behind Hourglass Apps.",
};

const team = [
  {
    name: "Your Name",
    role: "Founder",
    bio: "Building apps to make the most of your time.",
  },
];

export default function Team() {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The people behind Hourglass Apps.
        </p>
      </section>

      <section>
        <div className="grid gap-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-lg border border-black/[.08] p-5 dark:border-white/[.1]"
            >
              <h2 className="font-semibold">{member.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{member.role}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
