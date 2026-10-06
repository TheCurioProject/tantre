"use client";
import { Brand } from "../brand/Brand";
import { ChapterMotion } from "../motion/ChapterMotion";

export function BookingCTA() {
  return (
    <ChapterMotion className="booking-scene" scene="booking">
      <Brand name="line-13-camino" className="booking-path" data-draw />
      <p className="eyebrow">EL SIGUIENTE TRAZO ES TUYO</p>
      <h2>
        ¿Y si hoy haces
        <br />
        <em>algo con las manos?</em>
      </h2>
      <p>
        Nosotros ponemos la mesa.
        <br />
        Tú traes las ganas.
      </p>
      <a href="/reservar/" className="button">
        Reserva tu lugar
        <Brand name="ui-forward" />
      </a>
      <Brand name="doodle-mini-estrella" className="booking-star" />
    </ChapterMotion>
  );
}
