import { z } from 'zod';

export const createMechanicSchema = z.object({
  email: z.string().trim().email('valid email is required'),
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
  centerId: z.string().uuid('centerId must be a UUID'),
});

export const updateMechanicSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'lastName cannot be empty').optional(),
  centerId: z.string().uuid('centerId must be a UUID').optional(),
});

export type CreateMechanicDto = z.infer<typeof createMechanicSchema>;
export type UpdateMechanicDto = z.infer<typeof updateMechanicSchema>;
