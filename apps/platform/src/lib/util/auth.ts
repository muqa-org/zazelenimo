import { ZodSchema } from 'zod';

export function validateBody(body: any, schema: ZodSchema) {
	return schema.safeParse(body);
}
