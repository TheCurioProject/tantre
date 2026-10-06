"use client";
import { usePublicData } from "../Providers";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";

export function Location() {
  const { data } = usePublicData();
  const contact = data.settings.contact as
    | { address?: string; phone?: string; email?: string; instagram?: string }
    | undefined;

  return (
    <ChapterMotion id="visitanos" className="chapter visit" scene="visit" style={{ alignItems: 'center' }}>
      <div className="visit-info">
        <p className="eyebrow">NOS VEMOS AQUÍ</p>
        <h2>
          En el corazón
          <br />
          de <em>Guadalajara.</em>
        </h2>
        <div className="visit-details" style={{ marginTop: '2.5rem' }}>
          <Brand name="ui-pin" />
          <p>
            {contact?.address || "C. Reforma 464, Centro, Guadalajara, Jalisco"}
          </p>
          <a
            className="text-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact?.address || "TANTRE Reforma 464 Guadalajara")}`}
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar
            <Brand name="ui-forward" />
          </a>
          <a href={`tel:${contact?.phone || "+523321583412"}`}>
            {contact?.phone || "+52 33 2158 3412"}
          </a>
          <a href={`mailto:${contact?.email || "hola@tantre.mx"}`}>
            {contact?.email || "hola@tantre.mx"}
          </a>
          <p className="visit-small" style={{ marginTop: '1rem' }}>
            Para horarios de visita y recogida, consulta disponibilidad o
            escríbenos.
          </p>
        </div>
      </div>

      <div 
        className="visit-map" 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '450px', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          position: 'relative' 
        }}
      >
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3732.7427642481402!2d-103.3504764!3d20.6800418!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428b546948026e3%3A0x69fd52103aca855c!2sTantre%20Arte%20%26%20Caf%C3%A9!5e0!3m2!1ses!2smx!4v1791307656154!5m2!1ses!2smx"
          width="100%"
          height="100%"
          style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </ChapterMotion>
  );
}
