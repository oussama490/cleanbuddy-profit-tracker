function read(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function envVar(name: string): string {
  return read(name);
}

export function supabaseUrl(): string {
  return read("NEXT_PUBLIC_SUPABASE_URL") || read("SUPABASE_URL");
}

export function supabaseKey(): string {
  return (
    read("SUPABASE_SERVICE_ROLE_KEY") ||
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function appPassword(): string {
  return read("APP_PASSWORD");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}
