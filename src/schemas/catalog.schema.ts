import { z } from "zod";

export const categoryDocumentSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().nullable().optional(),
    subcategories: z.array(z.string()).optional(),
    productCount: z.number().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
  })
  .loose();

export const brandDocumentSchema = z
  .object({
    name: z.string(),
    slug: z.string(),
    logo: z.string().optional(),
    logoUrl: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    productCount: z.number().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
  })
  .loose();
