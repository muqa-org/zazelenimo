import { z } from 'zod';

export const UpdateUserRequestSchema = z.object({
  firstName: z.string().min(1, 'firstNameError'),
  lastName: z.string().min(1, 'lastNameError'),
  email: z.string().email('emailError'),
  mobile: z.string().min(1, 'mobileError'),
}).strip();
