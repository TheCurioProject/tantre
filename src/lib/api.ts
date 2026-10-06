export const apiBase =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8787" : "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}/api${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.",
      0,
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      data.error || "Algo no salió como esperábamos. Inténtalo de nuevo.",
      response.status,
      data.fields,
    );
  return data as T;
}
export const mediaUrl = (path: string, width?: number) =>
  `${apiBase}/api/media?path=${encodeURIComponent(path)}${width ? `&w=${width}` : ""}`;
