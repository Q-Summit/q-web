# 6 · Runtime

<!-- arc42 section 6: durable behavior, sequence/flow diagrams. -->

## Publish to live

The flagship flow: how an editor's change reaches the public site.

```mermaid
sequenceDiagram
  actor Editor as Division editor
  actor Approver
  participant CMS as Payload CMS
  participant CF as Cloudflare build
  participant Site as Public site

  Editor->>CMS: edit content as draft
  Editor->>CMS: submit for publish
  Approver->>CMS: approve and publish
  CMS->>CF: call deploy hook
  CF->>CMS: fetch published content
  CF->>Site: build and deploy static HTML
  Note over CF,Site: 2 to 4 minutes, atomic
```

_Drafts are invisible until approved; only a publish event triggers the rebuild, and the live site changes only when a build succeeds end to end._

- Rollback: redeploy any of the last 100 builds in one click (see [section 7](07-deployment.md)).
- The hook fires only on transitions to published state, debounced so a burst of edits triggers one rebuild.
