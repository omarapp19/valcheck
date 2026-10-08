import { describe, expect, it } from "vitest";
import { traducirErrorSupabase } from "@/lib/auth";

describe("Supabase Auth Error Translation", () => {
  it("translates invalid credentials properly", () => {
    expect(traducirErrorSupabase("Invalid login credentials")).toBe(
      "Correo o contraseña incorrectos."
    );
  });

  it("translates unconfirmed email properly", () => {
    expect(traducirErrorSupabase("Email not confirmed")).toContain(
      "Tu correo electrónico no ha sido confirmado"
    );
  });

  it("translates duplicate user registration properly", () => {
    expect(traducirErrorSupabase("User already registered")).toBe(
      "Ya existe un usuario registrado con este correo electrónico."
    );
  });

  it("translates email rate limit properly with helpful guidance", () => {
    const error = traducirErrorSupabase("over_email_send_rate_limit");
    expect(error).toContain("Límite de correos alcanzado en Supabase");
    expect(error).toContain("Confirm email");
  });

  it("translates short password error properly", () => {
    expect(traducirErrorSupabase("Password should be at least 6 characters")).toBe(
      "La contraseña debe tener al menos 6 caracteres."
    );
  });
});

import { ADMIN_EMAIL, esEmailAdmin } from "@/lib/auth";

describe("Admin Authorization Policy", () => {
  it("only authorizes omarapp1921@gmail.com as administrator", () => {
    expect(ADMIN_EMAIL).toBe("omarapp1921@gmail.com");
    expect(esEmailAdmin("omarapp1921@gmail.com")).toBe(true);
    expect(esEmailAdmin("OMARAPP1921@GMAIL.COM")).toBe(true);
    expect(esEmailAdmin(" omarapp1921@gmail.com ")).toBe(true);
  });

  it("denies administrator role for any other email", () => {
    expect(esEmailAdmin("admin@valcheck.ve")).toBe(false);
    expect(esEmailAdmin("admin@gmail.com")).toBe(false);
    expect(esEmailAdmin("cliente@valcheck.ve")).toBe(false);
    expect(esEmailAdmin("user@example.com")).toBe(false);
    expect(esEmailAdmin(null)).toBe(false);
    expect(esEmailAdmin(undefined)).toBe(false);
  });
});
