import * as migration_20260726_182256_initial from './20260726_182256_initial';
import * as migration_20260728_190500_team_linkedin from './20260728_190500_team_linkedin';
import * as migration_20260731_120000_team_email from './20260731_120000_team_email';

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
  {
    up: migration_20260731_120000_team_email.up,
    down: migration_20260731_120000_team_email.down,
    name: '20260731_120000_team_email',
  },
];
