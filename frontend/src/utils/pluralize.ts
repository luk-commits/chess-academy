export function plPlural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function stageLabel(count: number): string {
  return `${count} ${plPlural(count, 'etap', 'etapy', 'etapów')}`;
}

export function tasksLabel(count: number): string {
  return `${count} ${plPlural(count, 'zadanie', 'zadania', 'zadań')}`;
}
