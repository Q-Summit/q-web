#!/usr/bin/env node
// make package / pnpm content:export: local CMS to content package (assert local DB).
import { runLocalPayloadBin } from "../lib/local-payload.mjs";

runLocalPayloadBin("src/bin/export-package.ts");
