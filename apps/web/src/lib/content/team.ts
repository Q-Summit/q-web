/**
 * Team and past-team photo collections.
 */
import { fetchPublishedDocs, memoizeCms, stableOrderCompare } from "./cms";
import { resolveUploadFilename, type CmsMediaRef } from "./media";
import { CONTENT_SOURCE, readJson } from "./source";

export interface TeamMember {
  name: string;
  role: string;
  division: string;
  photoFilename: string;
  year: string;
  /** Optional LinkedIn profile URL; the card omits the icon when absent. */
  linkedin?: string | null;
  /** Optional email address; the card omits the mail icon when absent. */
  email?: string | null;
}

/** One group photo per past board year (see PastTeams.ts / past-teams.json). */
export interface PastTeam {
  year: string;
  photoFilename: string;
}

// division select values (access/divisions.ts DIVISIONS) -> the display
// labels team.json used (site copy expects "Public Relations", not the
// admin-UI-only "PR" label from DIVISIONS).
const TEAM_DIVISION_LABELS: Record<string, string> = {
  chair: "Chair",
  pr: "Public Relations",
  partner: "Partner",
  finance: "Finance",
  operations: "Operations",
  concept: "Concept",
  it: "IT",
};

interface CmsTeamDoc {
  id: number | string;
  name: string;
  role: string;
  division: string;
  photo: CmsMediaRef | number | string | null;
  year: string;
  linkedin?: string | null;
  email?: string | null;
  order?: number | null;
}

async function cmsGetTeam(): Promise<TeamMember[]> {
  const docs = await fetchPublishedDocs<CmsTeamDoc>("team");
  docs.sort(stableOrderCompare);
  const team: TeamMember[] = [];
  for (const doc of docs) {
    const division = TEAM_DIVISION_LABELS[doc.division] ?? doc.division;
    if (!TEAM_DIVISION_LABELS[doc.division]) {
      console.warn(
        `[content:cms] unmapped team division "${doc.division}" for "${doc.name}"`,
      );
    }
    team.push({
      name: doc.name,
      role: doc.role,
      division,
      photoFilename: await resolveUploadFilename(
        doc.photo,
        `team member ${doc.name}`,
      ),
      year: doc.year,
      linkedin: doc.linkedin ?? null,
      email: doc.email ?? null,
    });
  }
  return team;
}

export function getTeam(): Promise<TeamMember[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("team", cmsGetTeam)
    : readJson<TeamMember[]>("team.json");
}

interface CmsPastTeamDoc {
  id: number | string;
  year: string;
  photo: CmsMediaRef | number | string | null;
}

// "Photos" to keep it distinct from the page-global loader below
// (cmsGetPastTeams -> PastTeamsContent, the /past-teams page copy).
async function cmsGetPastTeamPhotos(): Promise<PastTeam[]> {
  const docs = await fetchPublishedDocs<CmsPastTeamDoc>("past-teams");
  const pastTeams: PastTeam[] = [];
  for (const doc of docs) {
    pastTeams.push({
      year: doc.year,
      photoFilename: await resolveUploadFilename(
        doc.photo,
        `past-team year ${doc.year}`,
      ),
    });
  }
  return pastTeams;
}

export function getPastTeamPhotos(): Promise<PastTeam[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("past-teams", cmsGetPastTeamPhotos)
    : readJson<PastTeam[]>("past-teams.json");
}
