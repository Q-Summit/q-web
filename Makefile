# Front door for local workbench + content sync.
# Zero-arg: `make propose`. With flags: `make propose ARGS='--dry-run'`
# or `pnpm content:propose -- --dry-run` (same scripts).
#
# `make pull` = content:pull (published REST → package). Not a Neon dump.
# Break-glass (TTY, scripts/ops/): pnpm ops:mirror-db | ops:mirror-media | ops:cms-remote

.PHONY: setup setup-chrome dev dev-web seed reset-local package pull propose preview lighthouse check check-fast db-up db-down

setup:
	pnpm run setup

setup-chrome:
	pnpm run setup:chrome

dev:
	pnpm run dev

dev-web:
	pnpm run dev:web

seed:
	pnpm run seed

reset-local:
	pnpm run reset:local

package:
	pnpm run content:export -- $(ARGS)

pull:
	pnpm run content:pull -- $(ARGS)

propose:
	pnpm run content:propose -- $(ARGS)

preview:
	pnpm r2:sync && pnpm preview:cf

lighthouse:
	pnpm run lighthouse -- $(ARGS)

check:
	pnpm run check

check-fast:
	pnpm run check:fast

db-up:
	pnpm db:up

db-down:
	pnpm db:down
