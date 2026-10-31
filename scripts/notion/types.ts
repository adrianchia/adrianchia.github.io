export interface CoverCredit {
  text: string;
  url: string | null;
}

export interface PostMeta {
  notionId: string;
  title: string;
  slug: string;
  /** YYYY-MM-DD, from the "Published Date" start. */
  date: string;
  /** Multi-select names, as typed. */
  tags: string[];
  description: string | null;
  /** page.cover (file or external). */
  coverUrl: string | null;
  /** "Cover Credit" plain text plus first link href. */
  coverCredit: CoverCredit | null;
}

export class SyncError extends Error {}
