import * as migration_20260726_182256_initial from './20260726_182256_initial';
import * as migration_20260728_190500_team_linkedin from './20260728_190500_team_linkedin';

export const migrations = [
  {
    up: migration_20260726_182256_initial.up,
    down: migration_20260726_182256_initial.down,
    name: '20260726_182256_initial',
  },
  {
    up: migration_20260728_190500_team_linkedin.up,
    down: migration_20260728_190500_team_linkedin.down,
    name: '20260728_190500_team_linkedin',
  },
];
