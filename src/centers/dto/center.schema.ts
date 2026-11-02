import { z } from 'zod';

const optionalTrimmed = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  });

export const createCenterSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  phoneNumber: optionalTrimmed.optional(),
  address: optionalTrimmed.optional(),
  locationArea: optionalTrimmed.optional(),
  zone: optionalTrimmed.optional(),
  state: optionalTrimmed.optional(),
  verified: z.boolean().optional(),
  country: z.string().trim().min(1).optional(),
});

export const updateCenterSchema = z.object({
  name: z.string().trim().min(1, 'name cannot be empty').optional(),
  phoneNumber: optionalTrimmed.optional(),
  address: optionalTrimmed.optional(),
  locationArea: optionalTrimmed.optional(),
  zone: optionalTrimmed.optional(),
  state: optionalTrimmed.optional(),
  verified: z.boolean().optional(),
  country: z.string().trim().min(1).optional(),
});

export type CreateCenterDto = z.infer<typeof createCenterSchema>;
export type UpdateCenterDto = z.infer<typeof updateCenterSchema>;
