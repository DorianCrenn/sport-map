import { z, ZodSchema } from 'zod';

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal(''));

const requiredText = (min: number, max: number, label: string) =>
  z.string()
    .min(min, `${label} requis (min ${min} caractère${min > 1 ? 's' : ''})`)
    .max(max, `${label} trop long (max ${max} caractères)`);

export const eventFormSchema = z.object({
  date:        z.string().min(1, 'La date est obligatoire'),
  sport:       z.string().min(1, 'Le sport est obligatoire'),
  city:        optionalText(100),
  venue:       optionalText(200),
  description: optionalText(2000),
  teamName:    optionalText(100),
  adversaire:  optionalText(100),
  level:       optionalText(50),
  homeTeam:    optionalText(100),
  awayTeam:    optionalText(100),
});

export const announcementSchema = z.object({
  type:    z.enum(['urgent', 'info', 'result', 'event'], {
    error: "Type d'annonce invalide",
  }),
  message: z
    .string()
    .min(2,   'Le message est requis (min 2 caractères)')
    .max(280, 'Message trop long (max 280 caractères)'),
});

export const clubSchema = z.object({
  name:        requiredText(2, 100, 'Nom'),
  sport:       z.string().min(1, 'Le sport est obligatoire'),
  city:        requiredText(1, 100, 'Ville'),
  email:       z.string().email('Email invalide').max(254),
  description: optionalText(1000),
  website:     optionalText(255),
  phone:       optionalText(20),
});

export const pushPayloadSchema = z.object({
  user_id: z.string().uuid('user_id invalide'),
  title:   z.string().min(1).max(120),
  body:    z.string().max(300).optional(),
  url:     z.string().url().optional().or(z.literal('/')),
  tag:     z.string().max(60).optional(),
});

type ValidateSuccess<T> = { ok: true; data: T; errors?: never };
type ValidateFailure = { ok: false; errors: Record<string, string>; data?: never };
export type ValidateResult<T> = ValidateSuccess<T> | ValidateFailure;

export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidateResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
