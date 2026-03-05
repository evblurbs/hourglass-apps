"use client";

import { useEffect, useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (localStorage.getItem("subscribed")) {
      setStatus("success");
      setMessage("You're subscribed! Thanks for signing up.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      localStorage.setItem("subscribed", "true");
      setStatus("success");
      setMessage("You're subscribed! Thanks for signing up.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="rounded-lg border border-black/[.08] p-6 dark:border-white/[.1]">
      <h3 className="mb-2 text-lg font-semibold">Stay in the loop</h3>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Get notified when we launch new apps or publish new posts.
      </p>
      {status === "success" ? (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 rounded-md border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-white/[.15] dark:placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>
      )}
    </div>
  );
}
