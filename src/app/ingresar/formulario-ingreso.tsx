"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { codigoSchema, correoSchema } from "@/lib/esquemas";

type Props = {
  nonce?: string;
  turnstileSiteKey: string;
  googleHabilitado: boolean;
};

/** Traduce los códigos de error de Supabase Auth a mensajes que digan qué hacer. */
function mensajeDeError(code: string | undefined) {
  switch (code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Pediste varios códigos seguidos. Espera un minuto y vuelve a intentarlo.";
    case "otp_expired":
      return "El código venció o no es correcto. Revisa el último correo o pide uno nuevo.";
    case "captcha_failed":
      return "No pudimos comprobar que no eres un robot. Recarga la página e intenta de nuevo.";
    case "email_address_invalid":
      return "Ese correo no parece válido. Revisa que esté bien escrito.";
    default:
      return "No se pudo completar el ingreso. Revisa tu conexión e intenta de nuevo.";
  }
}

export function FormularioIngreso({ nonce, turnstileSiteKey, googleHabilitado }: Props) {
  const router = useRouter();
  // Cambiar la llave remonta el widget y pide un token nuevo (cada token es de un solo uso).
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [correoEnviado, setCorreoEnviado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formCorreo = useForm<z.input<typeof correoSchema>, unknown, z.output<typeof correoSchema>>({
    resolver: zodResolver(correoSchema),
    defaultValues: { correo: "" },
  });
  const formCodigo = useForm<z.input<typeof codigoSchema>, unknown, z.output<typeof codigoSchema>>({
    resolver: zodResolver(codigoSchema),
    defaultValues: { codigo: "" },
  });

  async function enviarCodigo({ correo }: z.output<typeof correoSchema>) {
    setError(null);
    if (!captcha) {
      setError("Espera a que termine la verificación de seguridad.");
      return;
    }
    const { error } = await createClient().auth.signInWithOtp({
      email: correo,
      options: { captchaToken: captcha, shouldCreateUser: true },
    });
    setTurnstileKey((k) => k + 1);
    setCaptcha(null);
    if (error) {
      setError(mensajeDeError(error.code));
      return;
    }
    setCorreoEnviado(correo);
  }

  async function verificarCodigo({ codigo }: z.output<typeof codigoSchema>) {
    if (!correoEnviado) return;
    setError(null);
    const { error } = await createClient().auth.verifyOtp({
      email: correoEnviado,
      token: codigo,
      type: "email",
    });
    if (error) {
      setError(mensajeDeError(error.code ?? "otp_expired"));
      return;
    }
    router.replace("/inicio");
    router.refresh();
  }

  async function ingresarConGoogle() {
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(mensajeDeError(error.code));
  }

  if (correoEnviado) {
    const { errors, isSubmitting } = formCodigo.formState;
    return (
      <form onSubmit={formCodigo.handleSubmit(verificarCodigo)} className="mt-8 space-y-5" noValidate>
        <p>
          Enviamos un código de 6 números a <strong className="break-all">{correoEnviado}</strong>. Si no
          aparece, revisa la carpeta de spam.
        </p>
        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-base">
            Código
          </Label>
          <Input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            aria-invalid={Boolean(errors.codigo)}
            aria-describedby={errors.codigo ? "codigo-error" : undefined}
            className="h-14 text-center font-heading text-3xl tracking-[0.5em] tabular-nums"
            // Se puede pegar el código como venga ("123 456", "123-456"): solo cuentan los números.
            {...formCodigo.register("codigo", { setValueAs: (v: string) => v.replace(/\D/g, "") })}
          />
          {errors.codigo && (
            <p id="codigo-error" className="text-sm text-destructive">
              {errors.codigo.message}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSubmitting}>
          {isSubmitting ? "Verificando…" : "Entrar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setCorreoEnviado(null);
            setError(null);
            formCodigo.reset();
          }}
        >
          Usar otro correo o pedir un código nuevo
        </Button>
      </form>
    );
  }

  const { errors, isSubmitting } = formCorreo.formState;
  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={formCorreo.handleSubmit(enviarCodigo)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="correo" className="text-base">
            Correo
          </Label>
          <Input
            id="correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            aria-invalid={Boolean(errors.correo)}
            aria-describedby={errors.correo ? "correo-error" : undefined}
            className="h-12 text-base"
            {...formCorreo.register("correo")}
          />
          {errors.correo && (
            <p id="correo-error" className="text-sm text-destructive">
              {errors.correo.message}
            </p>
          )}
        </div>
        <Turnstile
          key={turnstileKey}
          siteKey={turnstileSiteKey}
          scriptOptions={{ nonce }}
          options={{ language: "es", size: "flexible", theme: "auto" }}
          onSuccess={setCaptcha}
          onExpire={() => setCaptcha(null)}
          onError={() => setCaptcha(null)}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSubmitting}>
          {isSubmitting ? "Enviando…" : "Enviarme el código"}
        </Button>
      </form>

      {googleHabilitado && (
        <>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full text-base"
            onClick={ingresarConGoogle}
          >
            Continuar con Google
          </Button>
        </>
      )}
    </div>
  );
}
