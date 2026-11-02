import { z } from 'zod';

export const createMemberSchema = z.object({
  email: z.string().trim().email('valid email is required'),
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1, 'lastName is required'),
});

export type CreateMemberDto = z.infer<typeof createMemberSchema>;
