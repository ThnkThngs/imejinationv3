import heroVideo from "@/assets/hero-montage.mp4";
import heroPoster from "@/assets/hero-montage-poster.jpg";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touchFirst = window.matchMedia("(pointer: coarse)");

    if (!hero || reducedMotion.matches || touchFirst.matches) return;

    let animationFrame = 0;

    const updateParallax = () => {
      const { top, height } = hero.getBoundingClientRect();
      const progress = Math.max(0, Math.min(-top, height));

      hero.style.setProperty("--hero-video-y", `${progress * -0.16}px`);
      hero.style.setProperty("--hero-light-y", `${progress * -0.28}px`);
      hero.style.setProperty("--hero-content-y", `${progress * -0.08}px`);
      hero.style.setProperty("--hero-cue-y", `${progress * 0.12}px`);
      animationFrame = 0;
    };

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!video) return;

    const syncMotionPreference = () => {
      if (reducedMotion.matches) {
        video.pause();
        setIsPaused(true);
        return;
      }

      void video.play().catch(() => setIsPaused(true));
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => reducedMotion.removeEventListener("change", syncMotionPreference);
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  };

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative h-screen min-h-[700px] w-full overflow-hidden"
    >
      <video
        ref={videoRef}
        src={heroVideo}
        poster={heroPoster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        className="absolute inset-0 h-[116%] w-full object-cover will-change-transform motion-reduce:transform-none [transform:translate3d(0,calc(-8%_+_var(--hero-video-y,0px)),0)_scale(1.08)]"
      />
      {/* Cinematic gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      <div
        aria-hidden="true"
        className="absolute -inset-x-1/3 -top-1/3 h-[150%] -rotate-12 bg-[linear-gradient(100deg,transparent_32%,rgba(80,220,205,0.16)_50%,transparent_68%)] blur-3xl will-change-transform motion-reduce:transform-none [transform:translate3d(0,var(--hero-light-y,0px),0)_rotate(-12deg)]"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] will-change-transform motion-reduce:transform-none [transform:translate3d(0,var(--hero-content-y,0px),0)]">
        <div className="flex h-full w-full flex-col justify-end px-6 pb-20 md:px-12 md:pb-32">
          <div className="mb-6 flex items-center gap-3 fade-up in-view">
            <span className="h-px w-12 bg-primary" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary">
              Aerial · Architecture · Property
            </span>
          </div>
          <h1 className="fade-up in-view font-display text-[15vw] font-light leading-[0.9] tracking-tight text-white md:text-[10rem]">
            IMEJI<span className="text-primary">NATION</span>
          </h1>
          <p
            className="fade-up in-view mt-8 max-w-xl text-base font-light leading-relaxed text-white/80 md:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            Elevating properties with stunning aerial and ground perspectives. See beyond the
            blueprint.
          </p>
          <div
            className="fade-up in-view mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.4s" }}
          >
            <Link
              to="/brief"
              className="group inline-flex items-center gap-3 bg-primary px-8 py-4 text-xs font-medium uppercase tracking-[0.25em] text-black transition-all hover:bg-primary/90"
            >
              Plan your shoot with AI
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a
              href="#work"
              className="text-xs uppercase tracking-[0.25em] text-white/70 underline-offset-8 transition-colors hover:text-primary hover:underline"
            >
              Explore Portfolio
            </a>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 will-change-transform motion-reduce:transform-none [transform:translate3d(-50%,var(--hero-cue-y,0px),0)]">
        <div className="h-12 w-px animate-pulse bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>

      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPaused ? "Play hero video" : "Pause hero video"}
        aria-pressed={isPaused}
        className="absolute bottom-7 right-6 z-20 grid h-11 w-11 place-items-center border border-white/25 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-12"
      >
        {isPaused ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M8 5.8v12.4a1 1 0 0 0 1.53.85l9.5-6.2a1 1 0 0 0 0-1.7l-9.5-6.2A1 1 0 0 0 8 5.8Z" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <rect x="6" y="5" width="4" height="14" rx="0.75" />
            <rect x="14" y="5" width="4" height="14" rx="0.75" />
          </svg>
        )}
      </button>
    </section>
  );
}
