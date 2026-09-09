import type { ErstiQuizResult } from "./ersti-quiz.config";
import { TEAM_ORDER } from "./ersti-quiz.config";

type QuizTeam = (typeof TEAM_ORDER)[number];

export interface QuizTeamLinkRow {
  team: string;
  notionHref?: string | null;
}

function foldTeamName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TEAM_ALIASES: Record<string, QuizTeam> = {
  "corporate relations": "Corporate",
  "startup and vc": "Startup & Venture Capital",
  startup: "Startup & Venture Capital",
  "speaker relations": "Speaker",
  "g and p": "Growth & Partnerships",
  hc: "Human Capital & Foreign Relations",
  hack: "Hackathon",
};

const CANONICAL_BY_FOLD = new Map<string, QuizTeam>(
  TEAM_ORDER.map((team) => [foldTeamName(team), team]),
);

export function canonicalQuizTeam(name: string): QuizTeam | undefined {
  const folded = foldTeamName(name);
  if (!folded) return undefined;
  return CANONICAL_BY_FOLD.get(folded) ?? TEAM_ALIASES[folded];
}

export function attachQuizTeamLinks(
  results: readonly ErstiQuizResult[],
  cmsResults: readonly QuizTeamLinkRow[],
): ErstiQuizResult[] {
  const links = new Map<QuizTeam, string>();
  for (const row of cmsResults) {
    const team = canonicalQuizTeam(row.team);
    const href = row.notionHref?.trim();
    if (!team || !href) continue;
    links.set(team, href);
  }

  return results.map((result) => ({
    ...result,
    notionHref: links.get(result.team as QuizTeam) ?? "",
  }));
}
