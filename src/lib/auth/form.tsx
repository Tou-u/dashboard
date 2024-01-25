"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

export function AuthForm({
  children,
  action,
  type,
}: {
  children: React.ReactNode;
  action: (prevState: unknown, formData: FormData) => Promise<ActionResult>;
  type: "signup" | "login";
}) {
  const [state, formAction] = useFormState(action, {
    error: null,
  });
  return (
    <form
      action={formAction}
      className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
    >
      {children}
      <SubmitButton type={type} />
      <p className="text-center">{state?.error}</p>
    </form>
  );
}

function SubmitButton({ type }: { type: "signup" | "login" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      {type === "signup" ? "Create account" : "Continue"}
    </Button>
  );
}

export interface ActionResult {
  error: string | null;
}
