export const DEFAULT_POST_LOGIN_PATH = "/admin";

export function getSafeLoginCallbackUrl(
  value: string | null | undefined,
  fallback: string = DEFAULT_POST_LOGIN_PATH
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  let candidate = value.trim();

  if (!candidate) {
    return fallback;
  }

  try {
    candidate = decodeURIComponent(candidate).trim();
  } catch {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.includes("\\") || candidate.includes("://")) {
    return fallback;
  }

  if (/[\s<>'"\u0000-\u001F\u007F]/.test(candidate)) {
    return fallback;
  }

  return candidate;
}
