import { Link } from "@tanstack/react-router";
import { useState } from "react";
import aerialVisual from "@/assets/page_03.jpg";
import architectureVisual from "@/assets/page_29.jpg";
import propertyVisual from "@/assets/page_21.jpg";
import commercialVisual from "@/assets/page_38.jpg";

const services = [
  {
    type: "Aerial",
    title: "Aerial & Drone",
    desc: "Cinematic drone footage and stills for townships, launches, and progress documentation.",
    image: aerialVisual,
    alt: "Aerial panorama of a landscaped township",
  },
  {
    type: "Architecture",
    title: "Architecture & Interior",
    desc: "Designed-space photography for completed buildings, show units, and sales galleries.",
    image: architectureVisual,
    alt: "Contemporary interior photographed with warm architectural lighting",
  },
  {
    type: "Property",
    title: "Property & Landscape",
    desc: "Twilight shoots, lifestyle angles, and township-wide aerials for marketing collateral.",
    image: propertyVisual,
    alt: "Landscaped property entrance surrounded by mature greenery",
  },
  {
    type: "Commercial",
    title: "Commercial & Still Life",
    desc: "Food, product, and brand imagery for hospitality and F&B clients.",
    image: commercialVisual,
    alt: "Styled Japanese dishes photographed for a commercial campaign",
  },
];

export function Services() {
  const [activeService, setActiveService] = useState(0);
  const active = services[activeService];

  return (
    <section id="services" className="relative bg-black py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-12">
        <div className="mint-divider" />
        <div className="grid grid-cols-12 gap-8 pt-16 md:pt-20">
          <div className="col-span-12 md:col-span-5">
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary">Disciplines</span>
            <h2 className="mt-4 font-display text-4xl font-light text-white md:text-5xl">
              What we <span className="italic text-primary">shoot</span>.
            </h2>
          </div>
          <p className="col-span-12 self-end text-sm leading-relaxed text-white/60 md:col-span-6 md:col-start-7">
            From rooftop to tabletop — four focused practices, one studio. Pick the closest fit and
            start a brief; we'll shape the rest with you.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-8 md:mt-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12">
          <div className="order-2 border-t border-white/10 lg:order-1" role="list">
            {services.map((service, index) => {
              const isActive = index === activeService;
              return (
                <article
                  key={service.type}
                  className="border-b border-white/10"
                  role="listitem"
                  onMouseEnter={() => setActiveService(index)}
                >
                  <button
                    type="button"
                    className="group flex w-full items-center gap-5 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:py-7"
                    aria-expanded={isActive}
                    aria-controls={`service-detail-${index}`}
                    onClick={() => setActiveService(index)}
                    onFocus={() => setActiveService(index)}
                  >
                    <span className="font-display text-xs text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3
                      className={`flex-1 font-display text-2xl font-light leading-tight transition-colors md:text-3xl ${
                        isActive ? "text-primary" : "text-white group-hover:text-primary"
                      }`}
                    >
                      {service.title}
                    </h3>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 shrink-0 fill-none stroke-current text-primary transition-transform duration-500 motion-reduce:transition-none ${
                        isActive ? "rotate-45" : ""
                      }`}
                    >
                      <path d="M12 5v14M5 12h14" strokeWidth="1.4" />
                    </svg>
                  </button>
                  <div
                    id={`service-detail-${index}`}
                    aria-hidden={!isActive}
                    className={`grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none ${
                      isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-7 pl-10 md:pl-12">
                        <p className="max-w-md text-sm leading-relaxed text-white/60">
                          {service.desc}
                        </p>
                        <Link
                          to="/brief"
                          search={{ type: service.type }}
                          tabIndex={isActive ? 0 : -1}
                          className="mt-5 inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-xs uppercase tracking-[0.25em] text-primary transition-all hover:gap-3 hover:border-primary"
                        >
                          Start a brief
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <figure className="group relative order-1 min-h-[360px] overflow-hidden bg-card lg:order-2 lg:min-h-[620px]">
            {services.map((service, index) => (
              <img
                key={service.type}
                src={service.image}
                alt={index === activeService ? service.alt : ""}
                aria-hidden={index !== activeService}
                className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform,filter] duration-700 motion-reduce:transition-none ${
                  index === activeService
                    ? "scale-100 opacity-100 brightness-90"
                    : "pointer-events-none scale-[1.035] opacity-0 brightness-75"
                }`}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            <figcaption
              className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-8"
              aria-live="polite"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
                  Current discipline
                </p>
                <p className="mt-2 font-display text-2xl font-light text-white md:text-3xl">
                  {active.title}
                </p>
              </div>
              <span className="font-display text-xs text-white/60">
                {String(activeService + 1).padStart(2, "0")} /{" "}
                {String(services.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        </div>
        <div className="mint-divider mt-20" />
      </div>
    </section>
  );
}
