"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema } from "@/lib/validators/settingsSchemas";
import { authApi } from "@/lib/api/authApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await authApi.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notifySuccess(res?.data?.message || "Password updated successfully");
      reset();
    } catch (e) {
      notifyError(e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Current password" error={errors.currentPassword?.message}>
          <input
            type="password"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
            placeholder="••••••••"
            {...register("currentPassword")}
          />
        </Field>

        <div />

        <Field label="New password" error={errors.newPassword?.message}>
          <input
            type="password"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
            placeholder="••••••••"
            {...register("newPassword")}
          />
        </Field>

        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <input
            type="password"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

