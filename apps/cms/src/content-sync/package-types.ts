export type MediaRef = { filename: string; alt?: string | null };

export type ContentPackageMeta = {
  version: number;
  exportedAt?: string;
  source?: string;
  scope?: {
    collections?: string[];
    globals?: string[];
  };
};

export type ContentPackage = {
  package: ContentPackageMeta;
  collections?: Record<string, Record<string, unknown>[]>;
  globals?: Record<string, Record<string, unknown>>;
  media?: {
    manifest?: { filename: string; alt?: string | null }[];
  };
};

export type SyncApplyResult = {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: string[];
  dryRun: boolean;
};
