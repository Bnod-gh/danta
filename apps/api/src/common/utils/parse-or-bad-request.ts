import { BadRequestException } from '@nestjs/common';
import type { z } from 'zod';

/**
 * Runtime-validate a request body with its zod schema, converting
 * validation failures into a readable 400 instead of letting raw
 * values reach Prisma (which would surface as a 500).
 *
 * Returns the schema's OUTPUT type so `.default()`ed fields are non-optional.
 */
export function parseOrBadRequest<S extends z.ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
        return `Invalid ${path}: ${issue.message.toLowerCase()}`;
      })
      .filter(Boolean)
      .join('. ');
    throw new BadRequestException(message || 'The submitted details are incomplete or invalid.');
  }
  return result.data;
}
