#!/usr/bin/env bash
# One-time setup of the label scheme (see .github/ISSUE_TEMPLATE/ and
# .github/workflows/links.yml, which files issues with the "bug" label).
# Requires: gh CLI authenticated against the repo.
#
# Deliberately minimal: everything else (in review, in build) is derivable
# from GitHub-native state, open/closed issues and linked PRs.
set -euo pipefail

# Same contract as scripts/setup-repo.sh: explicit target repo, so a run from
# a fork clone never silently writes the scheme to the fork. Note: GitHub
# seeds new repos with its nine default labels; this script adds/updates ours
# (taking over the default "bug" with our description), it does not prune
# the rest.
repo="${1:-Q-Summit/q-web}"

create() { gh label create "$1" --repo "$repo" --color "$2" --description "$3" --force; }

# Intake
create "bug"                 "d73a4a" "Created via the Bug template or the weekly link check"
create "change-request"      "1d76db" "Created via the Website change request template"

# Triage outcomes that GitHub state can't express
create "accepted"            "2ea44f" "Triage said yes; work pending or underway"
create "parked"              "9e9e9e" "Deliberately on hold; blocker noted in a comment"

# Areas (optional on any issue or PR)
create "area: content"       "0e8a16" "Content model, collections, CMS data"
create "area: design"        "5319e7" "Layout, styling, visual design"
create "area: cms"           "fbca04" "Payload admin, roles, editor experience"
create "area: infra"         "c2e0c6" "Hosting, deploys, CI, analytics"

echo "Labels created."
