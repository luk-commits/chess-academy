import { describe, it, expect } from 'vitest';
import { plPlural, stageLabel, tasksLabel } from '../../../src/utils/pluralize';

describe('plPlural (Polish plural forms)', () => {
  it('returns "one" form for 1', () => {
    expect(plPlural(1, 'kot', 'koty', 'kotów')).toBe('kot');
  });

  it('returns "few" form for 2-4', () => {
    expect(plPlural(2, 'kot', 'koty', 'kotów')).toBe('koty');
    expect(plPlural(3, 'kot', 'koty', 'kotów')).toBe('koty');
    expect(plPlural(4, 'kot', 'koty', 'kotów')).toBe('koty');
  });

  it('returns "many" form for 5-21', () => {
    expect(plPlural(5, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(11, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(12, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(21, 'kot', 'koty', 'kotów')).toBe('kotów');
  });

  it('returns "few" form for 22-24, 32-34 etc.', () => {
    expect(plPlural(22, 'kot', 'koty', 'kotów')).toBe('koty');
    expect(plPlural(23, 'kot', 'koty', 'kotów')).toBe('koty');
    expect(plPlural(34, 'kot', 'koty', 'kotów')).toBe('koty');
    expect(plPlural(102, 'kot', 'koty', 'kotów')).toBe('koty');
  });

  it('returns "many" form for teens (11-14)', () => {
    expect(plPlural(12, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(13, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(14, 'kot', 'koty', 'kotów')).toBe('kotów');
    expect(plPlural(112, 'kot', 'koty', 'kotów')).toBe('kotów');
  });

  it('returns "many" form for 0', () => {
    expect(plPlural(0, 'kot', 'koty', 'kotów')).toBe('kotów');
  });
});

describe('stageLabel', () => {
  it('formats 1 etap', () => {
    expect(stageLabel(1)).toBe('1 etap');
  });

  it('formats 3 etapy', () => {
    expect(stageLabel(3)).toBe('3 etapy');
  });

  it('formats 5 etapów', () => {
    expect(stageLabel(5)).toBe('5 etapów');
  });
});

describe('tasksLabel', () => {
  it('formats 1 zadanie', () => {
    expect(tasksLabel(1)).toBe('1 zadanie');
  });

  it('formats 2 zadania', () => {
    expect(tasksLabel(2)).toBe('2 zadania');
  });

  it('formats 7 zadań', () => {
    expect(tasksLabel(7)).toBe('7 zadań');
  });
});
