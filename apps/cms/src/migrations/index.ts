import * as migration_20260726_182256_initial from './20260726_182256_initial';
import * as migration_20260728_190500_team_linkedin from './20260728_190500_team_linkedin';
import * as migration_20260731_120000_team_email from './20260731_120000_team_email';
import * as migration_20260830_212358_page_kickoff from './20260830_212358_page_kickoff';
import * as migration_20260831_150932_kickoff_speaker_crop from './20260831_150932_kickoff_speaker_crop';

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
  {
    up: migration_20260830_212358_page_kickoff.up,
    down: migration_20260830_212358_page_kickoff.down,
    name: '20260830_212358_page_kickoff',
  },
  {
    up: migration_20260831_150932_kickoff_speaker_crop.up,
    down: migration_20260831_150932_kickoff_speaker_crop.down,
    name: '20260831_150932_kickoff_speaker_crop'
  },
];
