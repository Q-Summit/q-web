import * as migration_20260726_182256_initial from './20260726_182256_initial';

export const migrations = [
  {
    up: migration_20260726_182256_initial.up,
    down: migration_20260726_182256_initial.down,
    name: '20260726_182256_initial',
  },
];
