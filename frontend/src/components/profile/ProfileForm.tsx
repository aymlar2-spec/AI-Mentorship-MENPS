import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Building2, Briefcase } from "lucide-react";
import { Button, Input, RadioGroup, SectionCard, TextArea } from "@/components/ui";
import { ThemeSelector } from "./ThemeSelector";
import { profileFormSchema, type ProfileFormValues } from "@/schemas/profile";
import {
  ENGAGEMENT_TYPE_OPTIONS,
  MENTORING_ROLE_OPTIONS,
  PROFILE_QUESTIONS,
  YES_NO_OPTIONS,
} from "./questionnaire";

export interface ProfileFormProps {
  defaultValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

/**
 * ProfileForm — MENPS design-system component.
 * The full mentoring questionnaire, faithfully reproducing the original
 * Google Forms wording (see ./questionnaire.ts). Composed entirely of
 * reusable form primitives (Input, TextArea, RadioGroup, ThemeSelector) —
 * no raw form markup. Works for both create and edit via `defaultValues`.
 */
export function ProfileForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <SectionCard
        title="Informations professionnelles"
        description="Ces informations nous aident à mieux vous situer au sein du réseau."
      >
        <Input
          label={PROFILE_QUESTIONS.current_position}
          leftIcon={<Briefcase className="h-4 w-4" />}
          required
          error={errors.current_position?.message}
          {...register("current_position")}
        />
        <Input
          label={PROFILE_QUESTIONS.entity}
          hint="Ex. Direction centrale, AREF, Direction provinciale, ou autre"
          leftIcon={<Building2 className="h-4 w-4" />}
          required
          error={errors.entity?.message}
          {...register("entity")}
        />
        <Input
          label={PROFILE_QUESTIONS.phone}
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
          required
          error={errors.phone?.message}
          {...register("phone")}
        />
        <RadioGroup
          label={PROFILE_QUESTIONS.whatsapp}
          options={YES_NO_OPTIONS}
          required
          error={errors.whatsapp?.message}
          {...register("whatsapp")}
        />
      </SectionCard>

      <SectionCard title="Votre participation au réseau">
        <RadioGroup
          label={PROFILE_QUESTIONS.mentoring_role}
          options={MENTORING_ROLE_OPTIONS}
          required
          error={errors.mentoring_role?.message}
          {...register("mentoring_role")}
        />

        <Controller
          control={control}
          name="theme_ids"
          render={({ field }) => (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text">
                {PROFILE_QUESTIONS.themes}
                <span className="text-danger ml-0.5">*</span>
              </span>
              <ThemeSelector
                value={field.value}
                onChange={field.onChange}
                error={errors.theme_ids?.message}
              />
            </div>
          )}
        />

        <RadioGroup
          label={PROFILE_QUESTIONS.engagement_type}
          options={ENGAGEMENT_TYPE_OPTIONS}
          required
          error={errors.engagement_type?.message}
          {...register("engagement_type")}
        />

        <RadioGroup
          label={PROFILE_QUESTIONS.previous_mentoring_experience}
          options={YES_NO_OPTIONS}
          required
          error={errors.previous_mentoring_experience?.message}
          {...register("previous_mentoring_experience")}
        />
      </SectionCard>

      <SectionCard
        title="Motivations et contributions"
        description="Ces questions sont facultatives, mais elles nous aident à mieux comprendre vos attentes."
      >
        <TextArea
          label={PROFILE_QUESTIONS.motivations}
          rows={4}
          error={errors.motivations?.message}
          {...register("motivations")}
        />
        <TextArea
          label={PROFILE_QUESTIONS.contributions}
          rows={4}
          error={errors.contributions?.message}
          {...register("contributions")}
        />
        <RadioGroup
          label={PROFILE_QUESTIONS.active_engagement}
          options={YES_NO_OPTIONS}
          error={errors.active_engagement?.message}
          {...register("active_engagement")}
        />
      </SectionCard>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
