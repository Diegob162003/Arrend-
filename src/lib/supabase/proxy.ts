import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

// Rutas que exigen sesión. La autorización real la hace RLS en la base de datos;
// esto solo evita mostrar pantallas vacías a quien no ha ingresado.
const RUTAS_PRIVADAS = ["/inicio", "/bienvenida"];

/**
 * Refresca la sesión de Supabase en cada petición y devuelve la respuesta
 * con las cookies actualizadas. `requestHeaders` lleva el nonce de la CSP.
 */
export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // No poner código entre createServerClient y getClaims: getClaims valida el JWT y refresca la sesión.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  if (!conSesion && RUTAS_PRIVADAS.some((ruta) => pathname.startsWith(ruta))) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}
