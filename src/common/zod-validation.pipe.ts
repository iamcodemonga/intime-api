import {
  BadRequestException,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
          return `${path}${issue.message}`;
        })
        .join('; ');
      throw new BadRequestException(message || 'Validation failed');
    }
    return result.data;
  }
}
