import type { ReactNode } from "react";
import { useForm, type FieldValues, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Button, Input, Modal, TextArea } from "@/components/ui";

export interface AIToolModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: ReactNode;
  schema: ZodType<T>;
  fieldName: Path<T>;
  defaultValues: T;
  label: string;
  placeholder?: string;
  fieldType?: "input" | "textarea";
  submitLabel?: string;
  isSubmitting: boolean;
  onSubmit: (values: T) => Promise<void>;
}

/**
 * AIToolModal — generic single-field form modal shared by the SMART Goals,
 * Session Summary, Action Plan, and Reformulate tools (see AIChat.tsx).
 * Each tool only differs by its label/placeholder/Zod schema/field name and
 * which app/routers/ai.py endpoint it ultimately calls — this component
 * keeps that variance data-driven instead of duplicating four near-identical
 * modals.
 */
export function AIToolModal<T extends FieldValues>({
  isOpen,
  onClose,
  title,
  description,
  schema,
  fieldName,
  defaultValues,
  label,
  placeholder,
  fieldType = "textarea",
  submitLabel = "Envoyer",
  isSubmitting,
  onSubmit,
}: AIToolModalProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({
    // The generic zodResolver<T> signature doesn't unify cleanly with an
    // arbitrary caller-supplied `ZodType<T>` prop (TS can't prove T's
    // input/output shapes line up with FieldValues here) — each call site
    // pairs a concrete schema with a matching concrete T, so this is safe
    // in practice; only the generic wrapper itself needs the cast.
    resolver: zodResolver(schema as never) as Resolver<T>,
    defaultValues: defaultValues as never,
  });

  if (!isOpen) return null;

  const fieldError = errors[fieldName]?.message as string | undefined;
  const registration = register(fieldName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <form
        onSubmit={handleSubmit((values) => onSubmit(values))}
        noValidate
        className="flex flex-col gap-4"
      >
        {fieldType === "textarea" ? (
          <TextArea
            label={label}
            placeholder={placeholder}
            rows={5}
            error={fieldError}
            autoFocus
            {...registration}
          />
        ) : (
          <Input
            label={label}
            placeholder={placeholder}
            error={fieldError}
            autoFocus
            {...registration}
          />
        )}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
