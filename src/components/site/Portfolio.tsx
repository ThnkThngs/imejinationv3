import { useEffect, useState } from "react";
import { ShutterImage } from "./ShutterImage";
import { supabase } from "@/integrations/supabase/client";
import type { PortfolioItem, MediaItem } from "@/lib/admin/mock-data";
import aerialOne from "@/assets/page_02.jpg";
import aerialTwo from "@/assets/page_05.jpg";
import aerialThree from "@/assets/page_07.jpg";
import aerialFour from "@/assets/page_16.jpg";
import architectureOne from "@/assets/page_21.jpg";
import architectureTwo from "@/assets/page_24.jpg";
import architectureThree from "@/assets/page_29.jpg";
import architectureFour from "@/assets/page_33.jpg";
import commercialOne from "@/assets/page_36.jpg";
import commercialTwo from "@/assets/page_38.jpg";
import commercialThree from "@/assets/page_39.jpg";
import commercialFour from "@/assets/page_40.jpg";

const archiveGroups = [
  {
    label: "Aerial & Landscape",
    shortLabel: "Aerial",
    images: [
      { src: aerialOne, alt: "Aerial studies of lakes, parks, and landscaped townships" },
      { src: aerialTwo, alt: "Twilight aerial views of a sculptural red pavilion" },
      { src: aerialThree, alt: "Wide aerial panorama of a Malaysian city and township" },
      { src: aerialFour, alt: "Industrial landscape glowing at sunset" },
    ],
  },
  {
    label: "Architecture & Interior",
    shortLabel: "Architecture",
    images: [
      { src: architectureOne, alt: "Landscaped property entrance and pavilion" },
      { src: architectureTwo, alt: "Rooftop pool overlooking the Kuala Lumpur skyline" },
      { src: architectureThree, alt: "Warm contemporary bedroom interior" },
      {
        src: architectureFour,
        alt: "Contemporary residential interiors and architectural details",
      },
    ],
  },
  {
    label: "Commercial & Still Life",
    shortLabel: "Commercial",
    images: [
      { src: commercialOne, alt: "Commercial food and beverage campaign photography" },
      { src: commercialTwo, alt: "Styled Japanese dishes photographed from above" },
      { src: commercialThree, alt: "Japanese dining spread and plated dishes" },
      { src: commercialFour, alt: "Sushi and restaurant lifestyle campaign photography" },
    ],
  },
];

export function Portfolio() {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [archiveGroup, setArchiveGroup] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activeArchive = archiveGroups[archiveGroup];

  useEffect(() => {
    let mounted = true;
    const load = () => {
      supabase
        .from("portfolio")
        .select("*")
        .eq("published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!mounted || error) return;
          setProjects((data ?? []) as unknown as PortfolioItem[]);
        });
    };
    load();

    const channel = supabase
      .channel("portfolio-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null
            ? null
            : (current - 1 + activeArchive.images.length) % activeArchive.images.length,
        );
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null ? null : (current + 1) % activeArchive.images.length,
        );
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeArchive.images.length, lightboxIndex]);

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
              const mediaList = mediaFor(p);
              const shown = mediaList.slice(0, 3);
              const cols =
                shown.length >= 3
                  ? "md:grid-cols-3"
                  : shown.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-1";
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
                    {shown.map((m, idx) => (
                      <figure
                        key={`${m.url}-${idx}`}
                        className="group relative aspect-[4/5] overflow-hidden bg-card"
                      >
                        {m.type === "video" ? (
                          <video
                            src={m.url}
                            poster={m.poster ?? undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="tile h-full w-full object-cover"
                          />
                        ) : (
                          <ShutterImage
                            src={m.url}
                            alt={`${p.title} — image ${idx + 1}`}
                            className="tile h-full w-full object-cover"
                          />
                        )}
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

        <div className="mt-28 border-t border-white/10 pt-16 md:mt-36 md:pt-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <span className="text-[11px] uppercase tracking-[0.3em] text-primary">
                Visual archive
              </span>
              <h3 className="mt-4 font-display text-3xl font-light text-white md:text-5xl">
                More ways we see a <span className="italic text-primary">place</span>.
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/60 lg:col-span-5 lg:col-start-8">
              Explore selected frames by discipline. Choose a category, then open any image for a
              closer view.
            </p>
          </div>

          <div
            className="mt-10 flex gap-2 overflow-x-auto border-b border-white/10 pb-3 md:mt-12 md:gap-3"
            role="tablist"
            aria-label="Portfolio archive categories"
          >
            {archiveGroups.map((group, index) => (
              <button
                key={group.label}
                type="button"
                role="tab"
                id={`archive-tab-${index}`}
                aria-label={group.label}
                aria-selected={archiveGroup === index}
                aria-controls="archive-panel"
                onClick={() => {
                  setArchiveGroup(index);
                  setLightboxIndex(null);
                }}
                className={`group relative shrink-0 border px-4 py-3 text-[10px] uppercase tracking-[0.22em] transition-[background-color,border-color,color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black md:px-5 md:text-[11px] ${
                  archiveGroup === index
                    ? "border-primary bg-primary text-black hover:border-transparent hover:bg-transparent hover:text-primary"
                    : "border-white/30 bg-white text-black hover:border-transparent hover:bg-transparent hover:text-white"
                }`}
              >
                <span className="md:hidden">{group.shortLabel}</span>
                <span className="hidden md:inline">{group.label}</span>
                <span className="absolute inset-x-0 -bottom-px h-px scale-x-0 bg-primary transition-transform duration-300 motion-reduce:transition-none group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              </button>
            ))}
          </div>

          <div
            id="archive-panel"
            role="tabpanel"
            aria-labelledby={`archive-tab-${archiveGroup}`}
            className="mt-8 grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:gap-6"
          >
            <ArchiveTile
              image={activeArchive.images[0]}
              label={activeArchive.label}
              index={0}
              prominent
              onOpen={() => setLightboxIndex(0)}
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-6">
              {activeArchive.images.slice(1).map((image, index) => (
                <ArchiveTile
                  key={image.src}
                  image={image}
                  label={activeArchive.label}
                  index={index + 1}
                  wideOnMobile={index === activeArchive.images.slice(1).length - 1}
                  onOpen={() => setLightboxIndex(index + 1)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeArchive.label} image ${lightboxIndex + 1}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm md:p-10"
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center border border-white/25 bg-black/40 text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:right-8 md:top-8"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
            >
              <path d="m6 6 12 12M18 6 6 18" strokeWidth="1.5" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Previous image"
            onClick={() =>
              setLightboxIndex(
                (lightboxIndex - 1 + activeArchive.images.length) % activeArchive.images.length,
              )
            }
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center border border-white/25 bg-black/40 text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:left-8"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
            >
              <path d="m15 5-7 7 7 7" strokeWidth="1.5" />
            </svg>
          </button>

          <figure className="flex max-h-full max-w-6xl flex-col items-center">
            <img
              src={activeArchive.images[lightboxIndex].src}
              alt={activeArchive.images[lightboxIndex].alt}
              className="max-h-[78vh] max-w-full object-contain"
            />
            <figcaption className="mt-5 flex w-full items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em] text-white/55">
              <span>{activeArchive.label}</span>
              <span>
                {String(lightboxIndex + 1).padStart(2, "0")} /{" "}
                {String(activeArchive.images.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>

          <button
            type="button"
            aria-label="Next image"
            onClick={() => setLightboxIndex((lightboxIndex + 1) % activeArchive.images.length)}
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center border border-white/25 bg-black/40 text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:right-8"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
            >
              <path d="m9 5 7 7-7 7" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

type ArchiveImage = (typeof archiveGroups)[number]["images"][number];

function ArchiveTile({
  image,
  label,
  index,
  prominent = false,
  wideOnMobile = false,
  onOpen,
}: {
  image: ArchiveImage;
  label: string;
  index: number;
  prominent?: boolean;
  wideOnMobile?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${label} image ${index + 1}`}
      className={`group relative w-full overflow-hidden bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        wideOnMobile ? "col-span-2 lg:col-span-1" : ""
      } ${
        prominent
          ? "aspect-[4/3] lg:h-full lg:min-h-[640px] lg:aspect-auto"
          : "aspect-[4/3] lg:aspect-[16/9]"
      }`}
    >
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-between gap-4 p-5 text-[10px] uppercase tracking-[0.22em] text-primary opacity-70 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:p-6">
        <span>{label}</span>
        <span className="text-white/70">View +</span>
      </span>
    </button>
  );
}

function inferKind(url: string): "image" | "video" {
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(clean)) return "video";
  return "image";
}

function mediaFor(p: PortfolioItem): MediaItem[] {
  const list: MediaItem[] = Array.isArray(p.media) ? p.media : [];
  if (list.length > 0) return list;
  // Legacy fallback
  const gallery = (p.gallery_images ?? []).filter(Boolean);
  const urls = gallery.length > 0 ? gallery : p.cover_image ? [p.cover_image] : [];
  return urls.map((url) => ({ url, type: inferKind(url) }));
}
