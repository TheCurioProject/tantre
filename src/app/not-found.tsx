import { Brand } from "@/components/brand/Brand";
export default function NotFound() {
  return (
    <main id="main" className="simple-page">
      <Brand name="state-sin-resultados" className="error-art" />
      <p className="eyebrow">404 · UN TRAZO FUERA DEL PAPEL</p>
      <h1>
        Por aquí todavía
        <br />
        no hemos pintado.
      </h1>
      <p>La página que buscas no está disponible.</p>
      <a href="/" className="button">
        Volver al lienzo
      </a>
    </main>
  );
}
