import { useEffect, useState } from "react";
import { ShutterImage } from "./ShutterImage";
import { supabase } from "@/integrations/supabase/client";
import type { PortfolioItem } from "@/lib/admin/mock-data";

export function Portfolio() {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("portfolio")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted || error) return;
        setProjects((data ?? []) as PortfolioItem[]);
      });

    const channel = supabase
      .channel("portfolio-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "portfolio" },
        () => {
          supabase
            .from("portfolio")
            .select("*")
            .eq("published", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false })
            .then(({ data }) => {
              if (!mounted) return;
              setProjects((data ?? []) as PortfolioItem[]);
            });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="work" className="bg-black py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary">
              Selected Work · 2019 — 2026
            </span>
            <h2 className="mt-4 font-display text-4xl font-light text-white md:text-6xl">
              Frames that sell <br className="hidden md:block" />
              the <span className="text-primary italic">place</span>, not the pixel.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            A curated selection of recent commissions for Malaysia's leading developers and
            hospitality brands.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">New work coming soon.</p>
        ) : (
          <div className="space-y-24 md:space-y-32">
            {projects.map((p, i) => {
              const gallery = (p.gallery_images ?? []).filter(Boolean);
              const images = gallery.length > 0
                ? gallery.slice(0, 3)
                : p.cover_image
                  ? [p.cover_image]
                  : [];
              const cols = images.length >= 3 ? "md:grid-cols-3" : images.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
              return (
                <article key={p.id} className="grid grid-cols-12 gap-4 md:gap-6">
                  <header className="col-span-12 md:col-span-3 md:pt-2">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-primary">
                      / {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-light leading-tight text-white">
                      {p.title}
                    </h3>
                    {p.location && <p className="mt-2 text-sm text-white/50">{p.location}</p>}
                    <div className="mt-4 h-px w-12 bg-primary/60" />
                    {p.category && (
                      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
                        {p.category}
                      </p>
                    )}
                    {p.description && (
                      <p className="mt-4 text-sm leading-relaxed text-white/60">{p.description}</p>
                    )}
                  </header>

                  <div className={`col-span-12 grid gap-4 md:col-span-9 md:gap-6 ${cols}`}>
                    {images.map((src, idx) => (
                      <figure
                        key={`${src}-${idx}`}
                        className="group relative aspect-[4/5] overflow-hidden bg-card"
                      >
                        <ShutterImage
                          src={src}
                          alt={`${p.title} — image ${idx + 1}`}
                          className="tile h-full w-full object-cover"
                        />
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 to-transparent px-5 py-4 text-xs uppercase tracking-[0.2em] text-primary opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          {p.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
