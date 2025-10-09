export function isValidHHMM(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value) && (() => {
    const [h, m] = value.split(':').map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  })();
}

export function compareHHMM(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  const av = ah * 60 + am;
  const bv = bh * 60 + bm;
  return av - bv;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const s1 = toMin(aStart), e1 = toMin(aEnd), s2 = toMin(bStart), e2 = toMin(bEnd);
  return s1 < e2 && s2 < e1;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}