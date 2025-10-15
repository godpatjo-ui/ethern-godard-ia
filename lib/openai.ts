import OpenAI from "openai";
// ⚠️ Dev seulement : on lit directement app.json pour être sûr d'avoir la clé dans Expo Go
// En prod, on passera par un backend (ne jamais exposer la clé).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../app.json");

const apiKey: string = app?.expo?.extra?.openaiApiKey ?? "";

if (!apiKey) {
  console.warn("⚠️ Clé OpenAI manquante. Ajoute-la dans app.json > expo.extra.openaiApiKey");
} else {
  // Petit log masqué pour vérifier qu'on a bien une clé en runtime
  console.log("🔑 OpenAI key détectée (masquée):", apiKey.slice(0,8) + "… (" + apiKey.length + " chars)");
}

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // requis côté RN
});
