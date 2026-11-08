// One ticket model for all three views on /ticket-categories/ (cards, What's
// included, Compare tickets). Prices, savings, benefit status and the
// benefit count are only ever computed here, server side for the static
// HTML and client side (tickets.client.ts) when a picker or tab changes, so
// the three views cannot drift apart.
import type {
  TicketBenefitGroup,
  TicketCategoriesContent,
  TicketKey,
  TicketOffer,
} from "../../lib/content";

/** Whole euros, the format the 2027 price list uses: "€55". */
export const euro = (amount: number): string =>
  `€${Math.round(amount).toLocaleString("en-US")}`;

/** Regular price minus the current price; never negative. */
export const savings = (ticket: TicketOffer): number =>
  Math.max(0, ticket.regularPrice - ticket.price);

export type BenefitStatus =
  "included" | "not-included" | "required" | "not-required";

export function statusOf(
  group: TicketBenefitGroup,
  row: TicketBenefitGroup["rows"][number],
  key: TicketKey,
): BenefitStatus {
  const on = row.tickets.includes(key);
  if (group.kind === "eligibility") return on ? "required" : "not-required";
  return on ? "included" : "not-included";
}

/** True for the two statuses that read as positive (check icon). */
export const isPositive = (status: BenefitStatus): boolean =>
  status === "included" || status === "required";

/**
 * Benefits only: eligibility rows are requirements, not something a ticket
 * comes with, so "8 of 12 benefits included" never counts the student ID.
 */
export function benefitCount(
  groups: TicketBenefitGroup[],
  key: TicketKey,
): { included: number; total: number } {
  let included = 0;
  let total = 0;
  for (const group of groups) {
    if (group.kind !== "benefit") continue;
    for (const row of group.rows) {
      total += 1;
      if (row.tickets.includes(key)) included += 1;
    }
  }
  return { included, total };
}

/** Replace {name} placeholders; unknown names stay as written. */
export function fillLabel(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

type StatusLabels = Pick<
  TicketCategoriesContent["included"],
  "includedLabel" | "notIncludedLabel" | "requiredLabel" | "notRequiredLabel"
>;

export function statusLabel(
  status: BenefitStatus,
  labels: StatusLabels,
): string {
  switch (status) {
    case "included":
      return labels.includedLabel;
    case "not-included":
      return labels.notIncludedLabel;
    case "required":
      return labels.requiredLabel;
    case "not-required":
      return labels.notRequiredLabel;
  }
}

/** The JSON the client reads; everything the pickers and tabs need. */
export interface TicketClientData {
  purchaseHref: string;
  tickets: TicketOffer[];
  groups: TicketBenefitGroup[];
  labels: Pick<
    TicketCategoriesContent["included"],
    | "includedLabel"
    | "notIncludedLabel"
    | "requiredLabel"
    | "notRequiredLabel"
    | "ticketBuyLabel"
    | "countLabel"
  > & { saveLabel: string };
}

export function clientData(page: TicketCategoriesContent): TicketClientData {
  return {
    purchaseHref: page.offer.purchaseHref,
    tickets: page.offer.tickets,
    groups: page.included.groups,
    labels: {
      includedLabel: page.included.includedLabel,
      notIncludedLabel: page.included.notIncludedLabel,
      requiredLabel: page.included.requiredLabel,
      notRequiredLabel: page.included.notRequiredLabel,
      ticketBuyLabel: page.included.ticketBuyLabel,
      countLabel: page.included.countLabel,
      saveLabel: page.offer.saveLabel,
    },
  };
}
