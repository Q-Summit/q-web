#!/usr/bin/env bash
# One-time GitHub repository configuration, so repo governance lives in git
# instead of clicks. Requires: gh CLI authenticated with admin rights on the
# repo. Idempotent, safe to re-run after any settings drift.
#
# Companion: scripts/setup-labels.sh (labels used by templates and links.yml).
set -euo pipefail

repo="${1:-Q-Summit/q-web}"

echo "Configuring $repo ..."

# Merge policy: squash, merge commit, and rebase are all allowed. Prefer
# squash for small PRs; use a merge commit (or rebase) when the PR's atomic
# commits should stay on main. Squash still takes the PR title and body.
# Merged branches are deleted automatically.
gh api -X PATCH "repos/$repo" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=true \
  -F allow_rebase_merge=true \
  -F delete_branch_on_merge=true \
  -F allow_auto_merge=true \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY >/dev/null
echo "  ok merge policy (squash, merge commit, rebase; auto-delete branches)"

# Branch protection on main: the "Checks" workflow is required, one approving
# review, stale approvals dismissed on new pushes, conversations resolved.
# require_code_owner_reviews backs the CODEOWNERS gate that docs/README.md
# and .github/CODEOWNERS describe; without it CODEOWNERS only auto-requests
# reviewers and never blocks.
# enforce_admins stays false on purpose: an author cannot approve their
# own PR, so admins need the bypass to merge when no second reviewer is
# available; the required checks still run and the bypass is visible in
# the audit log.
# workflow-lint is path-filtered and must NOT be a required check (a PR that
# does not touch workflows would hang on a check that never runs).
gh api -X PUT "repos/$repo/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": {
    "strict": false,
    "checks": [{ "context": "Checks" }]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "required_conversation_resolution": true,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
echo "  ok branch protection on main (Checks required, 1 review)"

# SECURITY.md advertises GitHub's private "Report a vulnerability" button;
# this setting is what makes that button exist.
gh api -X PUT "repos/$repo/private-vulnerability-reporting" >/dev/null
echo "  ok private vulnerability reporting enabled"

echo "Repository configured."
