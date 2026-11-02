"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

/** Botón de borrar que pide confirmación en el mismo lugar antes de actuar. */
export function ConfirmarBorrado({
  accion,
  texto,
  pregunta = "¿Seguro que quieres borrarlo?",
}: {
  accion: () => Promise<{ error?: string }>;
  texto: string;
  pregunta?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string>();
  const [borrando, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <Button
        variant="destructive"
        size="lg"
        className="h-11 px-5 text-base"
        onClick={() => setConfirmando(true)}
      >
        {texto}
      </Button>
    );
  }

  return (
    <div className="space-y-3" role="group" aria-label="Confirmar borrado">
      <p className="font-medium">{pregunta}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="destructive"
          size="lg"
          className="h-11 px-5 text-base"
          disabled={borrando}
          onClick={() => iniciar(async () => setError((await accion()).error))}
        >
          {borrando ? "Borrando…" : "Sí, borrar"}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11 px-5 text-base"
          onClick={() => setConfirmando(false)}
        >
          No, conservarlo
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
