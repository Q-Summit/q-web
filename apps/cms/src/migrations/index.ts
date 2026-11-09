import * as migration_20260726_182256_initial from './20260726_182256_initial';
import * as migration_20260728_190500_team_linkedin from './20260728_190500_team_linkedin';
import * as migration_20260731_120000_team_email from './20260731_120000_team_email';
import * as migration_20260830_212358_page_kickoff from './20260830_212358_page_kickoff';
import * as migration_20260831_150932_kickoff_speaker_crop from './20260831_150932_kickoff_speaker_crop';
import * as migration_20260901_182545_kickoff_register_href from './20260901_182545_kickoff_register_href';
import * as migration_20260907_185943_kickoff_location_href from './20260907_185943_kickoff_location_href';
import * as migration_20261016_222725_hackathon_2026_partner_logos from './20261016_222725_hackathon_2026_partner_logos';
import * as migration_20261107_215149_ticket_page_2027 from './20261107_215149_ticket_page_2027';
import * as migration_20261108_160000_ticket_rows_checkboxes_additive from './20261108_160000_ticket_rows_checkboxes_additive';
import * as migration_20261109_195959_ticket_phases from './20261109_195959_ticket_phases';

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
    name: '20260831_150932_kickoff_speaker_crop',
  },
  {
    up: migration_20260901_182545_kickoff_register_href.up,
    down: migration_20260901_182545_kickoff_register_href.down,
    name: '20260901_182545_kickoff_register_href',
  },
  {
    up: migration_20260907_185943_kickoff_location_href.up,
    down: migration_20260907_185943_kickoff_location_href.down,
    name: '20260907_185943_kickoff_location_href',
  },
  {
    up: migration_20261016_222725_hackathon_2026_partner_logos.up,
    down: migration_20261016_222725_hackathon_2026_partner_logos.down,
    name: '20261016_222725_hackathon_2026_partner_logos',
  },
  {
    up: migration_20261107_215149_ticket_page_2027.up,
    down: migration_20261107_215149_ticket_page_2027.down,
    name: '20261107_215149_ticket_page_2027',
  },
  {
    up: migration_20261108_160000_ticket_rows_checkboxes_additive.up,
    down: migration_20261108_160000_ticket_rows_checkboxes_additive.down,
    name: '20261108_160000_ticket_rows_checkboxes_additive',
  },
  {
    up: migration_20261109_195959_ticket_phases.up,
    down: migration_20261109_195959_ticket_phases.down,
    name: '20261109_195959_ticket_phases'
  },
];
