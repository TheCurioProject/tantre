import { HeroCanvas } from "./HeroCanvas";
import { PaintInteraction } from "./PaintInteraction";
import { ChapterMotion } from "../motion/ChapterMotion";
import { Brand } from "../brand/Brand";
import { Packages } from "./Packages";

import { Process } from "./Process";
import { Coffee } from "./Coffee";
import { Community } from "./Community";
import { FAQ } from "./FAQ";
import { BookingCTA } from "./BookingCTA";
import { Location } from "./Location";

export function Home() {
  return (
    <main id="main" className="home-page">
      {/* 1. Hook / Hero */}
      <HeroCanvas />

      {/* 2. Intro / Connection */}
      <ChapterMotion id="experiencia" className="chapter intro">
        <p className="eyebrow">01 / BAJA EL RITMO</p>
        <h2 data-place>
          No necesitas ser artista.
          <br />
          <em>Solo darte el tiempo.</em>
        </h2>
        <Brand name="doodle-subrayado" className="intro-underline" data-draw />
        <p>
          En TANTRE, una pieza en blanco se convierte en una excusa para estar
          presente. Tú eliges la cerámica, nosotros ponemos los materiales. El
          resto sucede entre pinceladas y café.
        </p>
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
          <Brand name="illus-cafe-pausa" style={{ maxWidth: "300px", width: "100%", height: "auto" }} />
        </div>
      </ChapterMotion>

      {/* 3. The Process (How it works - clarify before asking to buy) */}
      <Process />

      {/* 4. Interactive Teaser (Builds desire) */}
      <PaintInteraction />

      {/* 5. Value Add (Coffee shop vibes) */}
      <Coffee />

      {/* 6. Pricing & Offers (Now that they want it, show the packages) */}
      <Packages />

      {/* 7. Social Proof (Testimonials, Gallery) */}
      <Community />

      {/* 8. Overcome Objections (FAQs) */}
      <FAQ />

      {/* 9. Final CTA */}
      <BookingCTA />

      {/* 10. Practical info */}
      <Location />
    </main>
  );
}
