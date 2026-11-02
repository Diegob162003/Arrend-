"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoBorrado } from "../../actions";

export function BorrarInmueble({ accion }: { accion: () => Promise<EstadoBorrado> }) {
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
        Borrar inmueble
      </Button>
    );
  }

  return (
    <div className="space-y-3" role="group" aria-label="Confirmar borrado">
      <p className="font-medium">¿Seguro que quieres borrarlo?</p>
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
