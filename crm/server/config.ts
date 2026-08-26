export function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} es obligatoria.`);
  return value;
}

export function getAuthSecret(): string {
  return getRequiredEnvironmentVariable("CRM_AUTH_SECRET");
}

export function getDefaultPassword(): string {
  return getRequiredEnvironmentVariable("CRM_DEFAULT_PASSWORD");
}
