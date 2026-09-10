import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must not exceed 50 characters").optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^\+?[0-9]{7,15}$/.test(v), "Phone must be a valid phone number"),
    bio: z.string().max(250, "Bio must not exceed 250 characters").optional().or(z.literal("")),
  })
  .refine((v) => Boolean((v.name && v.name.trim()) || (v.phone && v.phone.trim()) || (v.bio && v.bio.trim())), {
    message: "Please change at least one field before saving",
    path: ["name"],
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(30, "New password must not exceed 30 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

