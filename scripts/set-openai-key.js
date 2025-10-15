const fs = require('fs');
const path = require('path');
const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

const p = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(p)) {
  console.error('❌ app.json introuvable à', p);
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(p, 'utf8'));
j.expo = j.expo || {};
j.expo.extra = j.expo.extra || {};

rl.question('Colle ta clé OpenAI UTILISATEUR (commence par sk-, ~51-56 chars, PAS sk-proj-): ', (key) => {
  const k = String(key || '').trim();

  if (!k.startsWith('sk-') || k.startsWith('sk-proj-')) {
    console.error('❌ Mauvaise clé. Il faut une clé UTILISATEUR (sk-…), pas sk-proj-');
    rl.close();
    process.exit(1);
  }
  if (k.length < 40 || k.length > 80) {
    console.error('❌ Longueur inattendue. Recolle la clé complète (≈51-56 caractères).');
    rl.close();
    process.exit(1);
  }

  j.expo.extra.openaiApiKey = k;
  fs.writeFileSync(p, JSON.stringify(j, null, 2));
  console.log('✅ Clé utilisateur enregistrée dans app.json → expo.extra.openaiApiKey');
  console.log('📏 Longueur:', k.length, '• Début:', k.slice(0,8), '• Fin:', k.slice(-6));
  rl.close();
});
