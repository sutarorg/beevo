import { z } from "zod";

/**
 * Shared form validation. Used by every auth form now, and reusable by
 * creator/course forms in later phases. Server-side handlers (Prompt 5)
 * must re-validate with the same schemas.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Tell us your name")
  .max(80, "Name is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, "Please accept the Terms and Refund policy to continue"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type FieldErrors = Record<string, string[]>;

/**
 * Validate `data` against a schema and return a flat fieldErrors map the
 * form components can render directly. Returns null when valid.
 */
export function validateFields<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { values: T; fieldErrors: null } | { values: null; fieldErrors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { values: result.data, fieldErrors: null };
  }
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return { values: null, fieldErrors };
}

/** First error message for a field, for inline rendering. */
export function firstError(
  fieldErrors: FieldErrors | null,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}
