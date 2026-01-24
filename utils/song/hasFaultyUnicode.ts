function hasFaultyUnicode(text: string): boolean {
  if (!text) return false;
  return /[^\u0000-\u007F]/.test(text) || /_/.test(text);
}

export { hasFaultyUnicode };
