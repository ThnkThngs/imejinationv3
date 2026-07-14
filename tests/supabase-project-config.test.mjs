import assert from "node:assert/strict";
import fs from "node:fs";

const config = fs.readFileSync(
  new URL("../src/integrations/supabase/project-config.ts", import.meta.url),
  "utf8",
);

assert.match(config, /REQUIRED_PROJECT_REF = "qmcuxesddwyhvmupgwdf"/);
assert.match(config, /sb_publishable__Rl4fID1F6GodrY0DoVpVA_Y5oKrZFO/);
assert.match(config, /configuredUrl\?\.includes\(REQUIRED_PROJECT_REF\)/);

console.log("Supabase project configuration is pinned to the active project.");
