"use client";

import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import type { FormState } from "@/app/admin/actions";

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  submit: string;
  pendingLabel?: string;
  className?: string;
  /** Clear the fields after a successful save (for "add" forms). */
  resetOnSuccess?: boolean;
  small?: boolean;
};

/** A form bound to a server action that shows the result message and disables the button while it works. */
export default function ActionForm({ action, children, submit, pendingLabel = "Збереження…", className = "", resetOnSuccess = false, small = false }: Props) {
  const [version, setVersion] = useState(0);
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const result = await action(prev, form);
    if (resetOnSuccess && result.ok) setVersion((v) => v + 1);
    return result;
  }, {});

  // React 19 clears every field after a <form action> finishes, even on an error. Submitting by hand keeps
  // what the user typed when something is wrong; successful "add" forms are cleared through the key below.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      // Changing the key after a successful "add" clears the uncontrolled fields.
      key={version}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={pending} className={`btn btn-primary disabled:opacity-60 ${small ? "!px-4 !py-2" : ""}`}>
          {pending ? pendingLabel : submit}
        </button>
        {state.ok && <p role="status" className="text-sm font-bold text-brand-green">{state.ok}</p>}
        {state.error && <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
