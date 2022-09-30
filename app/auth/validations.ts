import { z } from "zod";

export const FullNameSchema = z
  .string()
  .min(3, "Please ensure the full name is at least 3 characters long")
  .max(49, "Please ensure the full name is less than 50 characters long")

export const UsernameSchema = z
  .string()
  .min(4)
  .max(50)
  .transform((str) => str.trim())

export const PasswordSchema = z
  .string()
  .min(4)
  .max(100)
  .transform((str) => str.trim());

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
})

export type CurrentUser = {
  id: number;
  username: string;
}

export const ADMIN = "Admin";
export const LENDER = "Lender";
export const APPLICANT = "Applicant";