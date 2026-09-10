"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@/lib/validators/settingsSchemas";
import { authApi } from "@/lib/api/authApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function ProfileForm() {
  const { user, refreshProfile } = useAuth();

  const defaultValues = useMemo(
    () => ({
      name: user?.name || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    }),
    [user?.name, user?.phone, user?.bio]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (values) => {
    try {
      // backend allows partial updates; strip empty strings so we don't send unchanged fields
      const payload = {};
      if (values.name?.trim()) payload.name = values.name.trim();
      if (values.phone?.trim()) payload.phone = values.phone.trim();
      if (values.bio?.trim()) payload.bio = values.bio.trim();

      const res = await authApi.updateProfile(payload);
      notifySuccess(res?.data?.message || "Profile updated successfully");
      await refreshProfile();
    } catch (e) {
      notifyError(e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
            placeholder="Your name"
            {...register("name")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
            placeholder="+971..."
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Bio" error={errors.bio?.message}>
        <textarea
          rows={4}
          className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
          placeholder="Short bio (optional)"
          {...register("bio")}
        />
      </Field>

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

