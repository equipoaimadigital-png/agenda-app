import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args) },
  }),
}));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "1.2.3.4" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    redirectMock(...args);
    // next/navigation's redirect() aborta la ejecución lanzando internamente;
    // se simula igual acá para que el código después de redirect() no corra.
    throw new Error("NEXT_REDIRECT");
  },
}));

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("signIn", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    redirectMock.mockReset();
  });

  it("con credenciales inválidas, devuelve un mensaje de error claro y no redirige", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { message: "Invalid login credentials", status: 400 },
    });

    const { signIn } = await import("./auth");
    const result = await signIn(formDataOf({ email: "test@test.com", password: "wrong" }));

    expect(result).toEqual({ error: "Correo o contraseña incorrectos." });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("si Supabase falla por conexión (no credenciales), distingue el mensaje", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { message: "network timeout", status: 500 },
    });

    const { signIn } = await import("./auth");
    const result = await signIn(formDataOf({ email: "test@test.com", password: "x" }));

    expect(result).toEqual({ error: "Problema de conexión. Intenta de nuevo en unos segundos." });
  });

  it("con credenciales válidas, redirige al dashboard", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    const { signIn } = await import("./auth");
    await expect(
      signIn(formDataOf({ email: "test@test.com", password: "correcta" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("llama a signInWithPassword con el email y password exactos del formulario", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    const { signIn } = await import("./auth");
    await expect(
      signIn(formDataOf({ email: "  usuario@negocio.cl  ", password: "clave123" }))
    ).rejects.toThrow();

    // El email se recorta (trim) antes de mandarlo a Supabase
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "usuario@negocio.cl",
      password: "clave123",
    });
  });
});
