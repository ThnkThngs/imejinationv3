import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { Portfolio } from "@/components/site/Portfolio";
import { Social } from "@/components/site/Social";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imejination — Aerial & Architectural Photography Studio" },
      {
        name: "description",
        content:
          "Imejination is a Malaysian photography studio capturing aerial, architectural and commercial imagery for leading property developers.",
      },
      { property: "og:title", content: "Imejination — Aerial & Architectural Photography" },
      {
        property: "og:description",
        content: "Elevating properties with stunning aerial and ground perspectives.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Nav />
      <main>
        <Hero />
        <Portfolio />
        <Services />
        <Social />
      </main>
      <Footer />
    </div>
  );
}
