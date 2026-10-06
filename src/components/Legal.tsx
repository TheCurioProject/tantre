"use client";
import { usePublicData } from "./Providers";
export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const { data } = usePublicData();
  const text = data.settings[kind];
  return (
    <main id="main" className="simple-page legal-page">
      <p className="eyebrow">CON CLARIDAD, DESDE EL PRINCIPIO</p>
      <h1>
        {kind === "terms" ? "Términos de reservación" : "Aviso de privacidad"}
      </h1>
      {typeof text === "string" && data.settings.legal_published ? (
        <div className="legal-copy">
          {text.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <>
          <p>
            Estamos preparando la información de{" "}
            {kind === "terms" ? "reservación" : "privacidad"} para este sitio.
          </p>
          <p>
            Las reservas en línea permanecerán deshabilitadas hasta que esta
            información esté publicada. Para consultar las condiciones de tu
            visita, contáctanos en{" "}
            <a href="mailto:hola@tantre.mx">hola@tantre.mx</a>.
          </p>
        </>
      )}
      {kind === "privacy" && (
        <button
          className="text-link"
          onClick={() => {
            try {
              localStorage.removeItem("tantre:analytics");
              location.reload();
            } catch {}
          }}
        >
          Cambiar mi preferencia de medición
        </button>
      )}
    </main>
  );
}
