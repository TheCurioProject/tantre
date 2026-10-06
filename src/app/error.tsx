"use client";
import { State } from "@/components/brand/State";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="simple-page">
      <State title="Se nos salió un trazo." onRetry={reset}>
        Tu lugar sigue aquí. Volvamos a intentarlo.
      </State>
      <a href="/" className="text-link">
        Volver al inicio
      </a>
    </main>
  );
}
