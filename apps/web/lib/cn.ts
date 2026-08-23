type ClassValue = string | number | null | undefined | false | ClassValue[];

function flatten(input: ClassValue[], out: string[]) {
  for (const v of input) {
    if (!v) continue;
    if (Array.isArray(v)) flatten(v, out);
    else out.push(String(v));
  }
}

export function cn(...inputs: ClassValue[]) {
  const out: string[] = [];
  flatten(inputs, out);
  return out.join(" ");
}
