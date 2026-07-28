import React from "react";
import type { PayloadRequest, ServerProps } from "payload";

import { Logout } from "@payloadcms/ui";
import type { EntityToGroup } from "@payloadcms/ui/shared";
import { EntityType, groupNavItems } from "@payloadcms/ui/shared";
import {
  DefaultNavClient,
  NavHamburger,
  NavWrapper,
} from "@payloadcms/next/client";
import { PREFERENCE_KEYS } from "payload/shared";

import { navGroupRank } from "../lib/nav-groups";
import { DocsLink } from "./docs-link";

/**
 * Left nav, replacing Payload's DefaultNav for one reason: group order.
 *
 * Payload derives nav groups from `[...collections, ...globals]` and orders
 * them by first appearance (groupNavItems), so every collection-derived group
 * necessarily sorts above every global-derived one. Website pages -- the
 * surface editors actually work in -- landed fourth, below Users. Array order
 * in payload.config.ts cannot fix that; overriding this component is the only
 * lever.
 *
 * This is a thin re-composition, not a fork: grouping, permission filtering,
 * active state, collapse preferences and i18n all still come from Payload's
 * own DefaultNavClient. We reorder the groups it receives and render the same
 * wrapper around it.
 *
 * DefaultNavClient / NavWrapper / NavHamburger come from the public
 * `@payloadcms/next/client` subpath but are tagged `@internal` in their type
 * declarations. Re-check this file on any Payload minor bump.
 *
 * Slots DefaultNav supports that this does not: `beforeNav`, `afterNavLinks`,
 * `afterNav`, `logout.Button` and `settingsMenu`. None are configured today;
 * wiring one means adding it here too. `beforeNavLinks` is deliberately gone
 * from the config -- only DefaultNav reads it, so DocsLink is rendered
 * directly below instead.
 */

type NavProps = { req?: PayloadRequest } & ServerProps;

export const Nav: React.FC<NavProps> = async (props) => {
  const { i18n, payload, permissions, req, visibleEntities } = props;
  if (!payload?.config || !permissions || !i18n) return null;

  const { collections, globals } = payload.config;

  const entities: EntityToGroup[] = [
    ...collections
      .filter(({ slug }) => visibleEntities?.collections.includes(slug))
      .map((entity) => ({ type: EntityType.collection as const, entity })),
    ...globals
      .filter(({ slug }) => visibleEntities?.globals.includes(slug))
      .map((entity) => ({ type: EntityType.global as const, entity })),
  ];

  const groups = groupNavItems(entities, permissions, i18n);

  // Stable sort: equal ranks keep Payload's own first-appearance order, so
  // an unlisted group is appended rather than shuffled.
  const ordered = groups
    .map((group, index) => ({ group, index }))
    .sort(
      (a, b) =>
        navGroupRank(a.group.label) - navGroupRank(b.group.label) ||
        a.index - b.index,
    )
    .map(({ group }) => group);

  // Payload's own nav-preference loader is not exported from any barrel; this
  // is the same query. It carries which nav groups the user has collapsed.
  const navPreferences = req?.user?.collection
    ? await req.payload
        .find({
          collection: "payload-preferences",
          depth: 0,
          limit: 1,
          pagination: false,
          req,
          where: {
            and: [
              { key: { equals: PREFERENCE_KEYS.NAV } },
              { "user.relationTo": { equals: req.user.collection } },
              { "user.value": { equals: req.user.id } },
            ],
          },
        })
        .then((res: { docs?: { value?: unknown }[] }) => res?.docs?.[0]?.value)
    : null;

  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap">
        <DocsLink />
        <DefaultNavClient
          groups={ordered}
          navPreferences={navPreferences as never}
        />
        <div className="nav__controls">
          <Logout />
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
};
