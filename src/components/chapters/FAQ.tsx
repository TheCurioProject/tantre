"use client";
import { usePublicData } from "../Providers";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";

const fallbackFaqs = [
  {
    id: "a",
    question: "¿Necesito saber pintar?",
    answer:
      "No. Puedes venir sin experiencia. Lo importante es disfrutar el proceso y hacer algo tuyo.",
  },
  {
    id: "b",
    question: "¿Qué necesito llevar?",
    answer:
      "Solo ganas de crear. Aquí encontrarás piezas, pinturas y pinceles para tu sesión.",
  },
  {
    id: "c",
    question: "¿Me llevo mi pieza el mismo día?",
    answer:
      "Tu pieza necesita un proceso de acabado y horneado después de pintar. En tu visita te indicaremos cuándo estará lista para recoger.",
  },
  {
    id: "d",
    question: "¿Puedo venir con un grupo?",
    answer:
      "Sí. Para grupos grandes o celebraciones, contáctanos y organizamos la visita contigo.",
  },
];

export function FAQ() {
  const { data } = usePublicData();
  const faqs = data.faqs && data.faqs.length ? data.faqs : fallbackFaqs;

  return (
    <ChapterMotion className="chapter faq-chapter" scene="faq">
      <div>
        <p className="eyebrow">ANTES DE VENIR</p>
        <h2>
          Por si
          <br />
          <em>te lo preguntas.</em>
        </h2>
        <Brand
          name="doodle-circulo-marcador"
          className="faq-doodle"
          data-draw
        />
      </div>
      <div className="faqs">
        {faqs.map((f) => (
          <details key={f.id}>
            <summary>
              {f.question}
              <Brand name="ui-forward" />
            </summary>
            <p>{f.answer}</p>
          </details>
        ))}
      </div>
    </ChapterMotion>
  );
}
