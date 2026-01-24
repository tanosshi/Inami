export function safeString(value: any): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return String(value);
  } catch {
    try {
      return (
        (value && typeof value.toString === "function" && value.toString()) ||
        ""
      );
    } catch {
      return "";
    }
  }
}
