import { z } from "zod";

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(2),
  isDefault: z.boolean().optional(),
});

export const userDocumentSchema = z
  .object({
    uid: z.string().optional(),
    email: z.string().email().optional(),
    display_name: z.string().optional(),
    created_time: z.unknown().optional(),
    displayName: z.string().optional(),
    phone: z.string().optional(),
    photoUrl: z.string().optional(),
    role: z.enum(["customer", "admin"]).optional(),
    addresses: z.array(addressSchema).optional(),
    defaultAddressId: z.string().optional(),
    active: z.boolean().optional(),
  })
  .loose();

export type AddressInput = z.infer<typeof addressSchema>;
