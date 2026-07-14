const REQUIRED_PROJECT_REF = "qmcuxesddwyhvmupgwdf";

const REQUIRED_PROJECT_URL = `https://${REQUIRED_PROJECT_REF}.supabase.co`;
const REQUIRED_PUBLISHABLE_KEY = "sb_publishable__Rl4fID1F6GodrY0DoVpVA_Y5oKrZFO";

export function resolveSupabaseProjectConfig(configuredUrl?: string, configuredKey?: string) {
  if (configuredUrl?.includes(REQUIRED_PROJECT_REF) && configuredKey) {
    return { url: configuredUrl, publishableKey: configuredKey };
  }

  return {
    url: REQUIRED_PROJECT_URL,
    publishableKey: REQUIRED_PUBLISHABLE_KEY,
  };
}
