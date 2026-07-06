import { z } from "zod";

/**
 * Canonical article frontmatter schema (blog: Frontmatter Validation).
 * `category` is validated here only as a non-empty slug-like string;
 * membership in the i18n category catalog (`ARTICLE_CATEGORY_IDS`) is a
 * separate check performed by the MDX loader, since it depends on the
 * full catalog rather than the shape of a single field.
 */
export const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.iso.date(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  cover: z.string().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
