const SENSITIVE_KEYS = new Set([
  "access_token",
  "accessToken",
  "authorization",
  "body",
  "config",
  "credential",
  "data",
  "email",
  "headers",
  "id_token",
  "idToken",
  "password",
  "refresh_token",
  "refreshToken",
  "request",
  "response",
  "secret_token",
  "secretToken",
  "token",
]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && value.constructor === Object;

const summarizeErrorLike = (value) => {
  const status = value?.response?.status ?? value?.status;
  const statusText = value?.response?.statusText ?? value?.statusText;
  const message = value?.message ?? statusText ?? "Request failed";
  const name = value?.name ?? "Error";

  return [
    name,
    status ? `status=${status}` : "",
    message ? `message=${message}` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const sanitizeConsoleValue = (value, depth = 0, seen = new WeakSet()) => {
  if (value == null || typeof value !== "object") return value;

  if (
    value instanceof Error ||
    value.response ||
    value.request ||
    value.config
  ) {
    return summarizeErrorLike(value);
  }

  if (typeof FormData !== "undefined" && value instanceof FormData) {
    return "[FormData redacted]";
  }

  if (typeof Response !== "undefined" && value instanceof Response) {
    return `Response status=${value.status}`;
  }

  if (seen.has(value)) return "[Circular]";
  if (depth >= 2) return "[Object redacted]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeConsoleValue(item, depth + 1, seen));
  }

  if (!isPlainObject(value)) {
    return Object.prototype.toString.call(value);
  }

  return Object.entries(value).reduce((safeValue, [key, entryValue]) => {
    safeValue[key] = SENSITIVE_KEYS.has(key)
      ? "[redacted]"
      : sanitizeConsoleValue(entryValue, depth + 1, seen);
    return safeValue;
  }, {});
};

const installSafeConsole = () => {
  if (typeof window === "undefined") return;
  if (window.__PULSIFY_SAFE_CONSOLE_INSTALLED__) return;

  window.__PULSIFY_SAFE_CONSOLE_INSTALLED__ = true;

  ["debug", "error", "info", "log", "warn"].forEach((method) => {
    const originalMethod = console[method]?.bind(console);
    if (!originalMethod) return;

    console[method] = (...args) => {
      originalMethod(...args.map((arg) => sanitizeConsoleValue(arg)));
    };
  });
};

installSafeConsole();
