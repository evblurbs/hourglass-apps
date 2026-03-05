import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Hourglass Apps",
  description: "Posts about the apps we're building.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Blog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Thoughts on building apps and making the most of your time.
        </p>
      </section>

      <section>
        {posts.length === 0 ? (
          <p className="text-zinc-500">No posts yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <h2 className="text-xl font-semibold group-hover:underline">
                    {post.title}
                  </h2>
                  <time className="mt-1 block text-sm text-zinc-500">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {post.excerpt && (
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
