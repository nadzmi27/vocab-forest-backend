// merriam-webster/types.ts
export type MWResponse = MWEntry[] | string[];

export interface MWEntry {
  // Always present
  meta: {
    id: string;
    uuid: string;
    sort: string;
    src: string;
    section: string;
    stems: string[];
    offensive: boolean;
  };
  hom?: number;
  hwi: {
    hw: string;
    prs?: MWPronunciation[];
  };
  fl?: string;
  shortdef: string[];

  // Optional

  ahws?: unknown;
  vrs?: unknown;
  lbs?: string[];
  sls?: string[];
  psl?: string;
  ins?: unknown[];
  cxs?: unknown[];
  def?: unknown[];
  uros?: unknown[];
  dros?: unknown[];
  dxnls?: unknown[];
  usages?: unknown[];
  syns?: unknown[];
  quotes?: unknown[];
  art?: unknown;
  table?: unknown;
  et?: unknown[];
  date?: string;
  [key: string]: unknown; // catch-all for anything else
}

interface MWPronunciation {
  mw: string;
  sound?: {
    audio: string;
    ref: string;
    stat: string;
  };
}
