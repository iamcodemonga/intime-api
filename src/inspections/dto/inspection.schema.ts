import { z } from 'zod';
import {
  CHECK_FIELD_IDS,
  GRADE_FIELD_IDS,
  PHOTO_SLOT_KEYS,
} from '../inspection-fields.js';

const checkResultSchema = z.enum(['pass', 'fail']);
const summaryGradeSchema = z.enum(['poor', 'fair', 'good', 'excellent']);

const checksSchema = z.object(
  Object.fromEntries(
    CHECK_FIELD_IDS.map((id) => [id, checkResultSchema]),
  ) as Record<(typeof CHECK_FIELD_IDS)[number], typeof checkResultSchema>,
);

const gradesSchema = z.object(
  Object.fromEntries(
    GRADE_FIELD_IDS.map((id) => [id, summaryGradeSchema]),
  ) as Record<(typeof GRADE_FIELD_IDS)[number], typeof summaryGradeSchema>,
);

export const createInspectionSchema = z.object({
  vehicleNumber: z.string().trim().min(1, 'vehicleNumber is required'),
  mileageKm: z.coerce.number().int().nonnegative('mileageKm must be >= 0'),
  year: z.coerce
    .number()
    .int()
    .min(1950, 'year is too early')
    .max(new Date().getFullYear() + 1, 'year is too late'),
  make: z.string().trim().min(1, 'make is required'),
  model: z.string().trim().min(1, 'model is required'),
  exteriorColour: z.string().trim().min(1, 'exteriorColour is required'),
  engineNumber: z.string().trim().min(1, 'engineNumber is required'),
  chassisNumber: z.string().trim().min(1, 'chassisNumber is required'),
  driverFirstName: z.string().trim().min(1, 'driverFirstName is required'),
  driverLastName: z.string().trim().min(1, 'driverLastName is required'),
  phoneNumber: z.string().trim().min(7, 'phoneNumber is required'),
  emailAddress: z.string().trim().email('valid emailAddress is required'),
  checks: checksSchema,
  grades: gradesSchema,
});

export const photoSlotKeySchema = z.enum(PHOTO_SLOT_KEYS);

export type CreateInspectionDto = z.infer<typeof createInspectionSchema>;
export type PhotoSlotKey = z.infer<typeof photoSlotKeySchema>;
