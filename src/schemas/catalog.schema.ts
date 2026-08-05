import { z } from "zod";

export const categoryDocumentSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().nullable().optional(),
    subcategories: z.array(z.string()).optional(),
    productCount: z.number().optional(),
    active: z.boolean().optional(),
  })
  .loose();

export const brandDocumentSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    productCount: z.number().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .loose();
