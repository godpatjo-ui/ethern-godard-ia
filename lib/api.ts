export async function fetchRandomNumbers(count = 5, min = 1, max = 49): Promise<number[]> {
  const url = `https://www.randomnumberapi.com/api/v1.0/random?min=${min}&max=${max}&count=${count}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Déduplique la réponse API (certains services peuvent renvoyer des doublons)
    const uniq = Array.from(new Set((Array.isArray(data) ? data : []).map((n) => Number(n)).filter(Number.isFinite)));
    // Si la liste est trop courte après dédup, on complète localement sans doublons
    while (uniq.length < count) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!uniq.includes(n)) uniq.push(n);
    }
    return uniq.slice(0, count).sort((a, b) => a - b);
  } catch {
    // Fallback offline : génère localement des valeurs uniques
    const out: number[] = [];
    while (out.length < count) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!out.includes(n)) out.push(n);
    }
    return out.sort((a, b) => a - b);
  }
}
