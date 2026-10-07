"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { Brand } from "../brand/Brand";
import { useRef } from "react";

const packages = [
  {
    title: "Paquete Pareja",
    icon: "doodle-corazon",
    pills: ["2 personas"],
    originalPrice: "$1,300",
    price: "$1,170",
    color: "#E293B8",
    maskName: "mask-paint-01",
    features: [
      "1 pieza a elección (rango $280 a $490)",
      "1 bebida gourmet",
      "1 snack",
      "Acceso a todos los materiales creativos",
      "2 horas para pintar",
      "Quema cerámica con acabado profesional",
    ],
  },
  {
    title: "Paquete Amigos",
    icon: "doodle-spark-3-lineas",
    pills: ["3 personas", "4 personas"],
    originalPrice: "$1,950",
    price: "$1,725",
    color: "#6D8AD5",
    maskName: "mask-paint-02",
    features: [
      "1 pieza a elección (rango $280 a $490)",
      "1 bebida",
      "1 snack",
      "Materiales y pinturas cerámicas",
      "2 horas de experiencia",
      "Quema profesional",
    ],
  },
  {
    title: "Paquete Familiar",
    icon: "doodle-mini-flor",
    pills: ["5 personas", "6 personas"],
    originalPrice: "$3,250",
    price: "$2,770",
    color: "#72D093",
    maskName: "mask-paint-04",
    features: [
      "1 pieza a elección (rango $280 a $490)",
      "1 bebida",
      "1 snack",
      "Acceso a materiales",
      "2 horas de experiencia",
      "Quema profesional",
    ],
  },
  {
    title: "Paquete Celebración",
    icon: "doodle-mini-estrella",
    pills: ["7 personas", "8 personas"],
    originalPrice: "$4,550",
    price: "$3,730",
    color: "#7763CE",
    maskName: "mask-paint-06",
    features: [
      "1 pieza a elección (rango $280 a $490)",
      "1 bebida",
      "1 snack",
      "Materiales completos",
      "2 horas de experiencia",
      "Quema profesional",
    ],
  },
];

export function Packages() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section className="packages-section" id="paquetes" ref={containerRef}>
      <motion.div 
        className="packages-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="eyebrow" style={{ fontSize: "16px", letterSpacing: "0.15em", color: "var(--pink)" }}>
          ELIGE TU EXPERIENCIA
        </h2>
        <h3>
          El paquete perfecto
          <br />
          <em>para tu visita.</em>
          <div className="packages-doodle">
            <Brand name="doodle-subrayado" />
          </div>
        </h3>
      </motion.div>
      
      <div className="packages-stack-container">
        {packages.map((pkg, i) => (
          <PackageCard 
            key={i} 
            pkg={pkg} 
            index={i} 
            progress={scrollYProgress} 
            total={packages.length} 
          />
        ))}

      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PackageCard({ pkg, index, progress, total }: any) {
  // Only apply scale and y effects, leaving opacity at 100% so they are not transparent.
  const startFade = index / total;
  const endFade = startFade + (1 / total);

  const scale = useTransform(progress, [startFade, endFade], [1, 0.95]);
  const y = useTransform(progress, [startFade, endFade], ["0%", "-5%"]);

  return (
    <div className="sticky-card-wrapper" style={{ top: `calc(10vh + ${index * 30}px)` }}>
      <motion.div 
        className="awwwards-card"
        style={{ 
          backgroundColor: pkg.color,
          scale,
          y
        }}
      >
        <div className="aww-left">
          {pkg.icon && (
            <div style={{ height: "60px", marginBottom: "30px", color: "#FDF6EC" }}>
              <Brand name={pkg.icon} style={{ height: "100%", width: "auto" }} />
            </div>
          )}
          <h4 className="aww-title">{pkg.title}</h4>
          <div className="aww-pills">
            {pkg.pills.map((pill: string, j: number) => (
              <span
                key={j}
                className="pill"
                style={{
                  backgroundColor: j === 0 ? "rgba(255,255,255,0.25)" : "transparent",
                  color: "#FDF6EC",
                  border: `1px solid ${j === 0 ? "transparent" : "rgba(255,255,255,0.4)"}`,
                }}
              >
                {pill}
              </span>
            ))}
          </div>
          <div className="aww-pricing">
            <span className="aww-price-original">{pkg.originalPrice}</span>
            <span className="aww-price-discount">{pkg.price}</span>
          </div>
        </div>

        <div className="aww-right">
          <p className="aww-includes-title">INCLUYE (POR PERSONA):</p>
          <ul className="aww-includes-list">
            {pkg.features.map((feature: string, k: number) => (
              <li key={k}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>•</span> 
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
