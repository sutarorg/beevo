"use client";

import { Check, Plus, RefreshCw, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ApiResult } from "@/lib/domain";
import { useDebouncedCallback } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/primitives";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * Debounced autosave field.
 * Validate immediately on keystroke → update local state → debounce 800ms →
 * service call → "Saving…" while awaiting → "Saved" only on adapter success →
 * on failure the value is preserved and a Retry action is offered.
 */
export function AutosaveField({
  id,
  label,
  initialValue,
  placeholder,
  hint,
  multiline = false,
  maxLength,
  validate,
  onSave,
  disabled = false,
}: {
  id: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  maxLength?: number;
  validate?: (value: string) => string | undefined;
  onSave: (value: string) => Promise<ApiResult<unknown>>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSaved = useRef(initialValue);

  const persist = async (next: string) => {
    if (next === lastSaved.current) return;
    setStatus("saving");
    setSaveError(null);
    const result = await onSave(next);
    if (result.ok) {
      lastSaved.current = next;
      setStatus("saved");
      window.setTimeout(() => {
        setStatus((current) => (current === "saved" ? "idle" : current));
      }, 2500);
    } else {
      setStatus("error");
      setSaveError(result.error.message);
    }
  };

  const { schedule, flush } = useDebouncedCallback(persist, 800);

  const handleChange = (next: string) => {
    setValue(next);
    const error = validate?.(next);
    setValidationError(error);
    if (error) {
      setStatus("dirty");
      return;
    }
    setSaveError(null);
    setStatus(next === lastSaved.current ? "idle" : "dirty");
    schedule(next);
  };

  const retry = () => {
    if (validate?.(value)) return;
    void persist(value);
  };

  return (
    <Field id={id} label={label} error={validationError} hint={!validationError ? hint : undefined}>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={flush}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          aria-invalid={Boolean(validationError) || undefined}
          className={cn(
            "w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-ink transition-colors placeholder:text-smoke focus:ring-4 focus:ring-accent/15 focus:outline-none",
            validationError ? "border-accent-deep" : "border-ink focus:border-accent",
          )}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={flush}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          invalid={Boolean(validationError)}
        />
      )}
      <div className="flex min-h-5 items-center justify-between gap-3 pt-1 text-[11px] font-semibold">
        <span aria-live="polite" className="inline-flex items-center gap-1.5">
          {status === "saving" ? (
            <span className="text-smoke">Saving…</span>
          ) : status === "saved" ? (
            <span className="inline-flex items-center gap-1 text-moss">
              <Check className="size-3.5" aria-hidden="true" /> Saved
            </span>
          ) : status === "dirty" && !validationError ? (
            <span className="text-smoke">Unsaved changes…</span>
          ) : null}
          {status === "error" ? <span className="font-bold text-accent-deep">{saveError}</span> : null}
        </span>
        <span className="flex items-center gap-2">
          {maxLength ? (
            <span className="text-smoke tabular-nums">
              {value.length}/{maxLength}
            </span>
          ) : null}
          {status === "error" ? (
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold text-ink uppercase"
            >
              <RefreshCw className="size-3" aria-hidden="true" /> Retry
            </button>
          ) : null}
        </span>
      </div>
    </Field>
  );
}

/** Learning outcomes list editor — optional, debounce-saved as a whole. */
export function OutcomesEditor({
  initialOutcomes,
  onSave,
  disabled = false,
}: {
  initialOutcomes: string[];
  onSave: (outcomes: string[]) => Promise<ApiResult<unknown>>;
  disabled?: boolean;
}) {
  const [outcomes, setOutcomes] = useState<string[]>(
    initialOutcomes.length > 0 ? initialOutcomes : [],
  );
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const serialized = useRef(JSON.stringify(initialOutcomes));

  const persist = async (next: string[]) => {
    const clean = next.map((outcome) => outcome.trim()).filter((outcome) => outcome.length > 0);
    if (JSON.stringify(clean) === serialized.current) return;
    setStatus("saving");
    setSaveError(null);
    const result = await onSave(clean);
    if (result.ok) {
      serialized.current = JSON.stringify(clean);
      setStatus("saved");
      window.setTimeout(() => setStatus((current) => (current === "saved" ? "idle" : current)), 2500);
    } else {
      setStatus("error");
      setSaveError(result.error.message);
    }
  };

  const { schedule } = useDebouncedCallback(persist, 800);

  const commit = (next: string[]) => {
    setOutcomes(next);
    setStatus("dirty");
    schedule(next);
  };

  const addRow = () => {
    if (!draft.trim()) return;
    commit([...outcomes, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="rounded-2xl border-2 border-ink bg-parchment/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">Learning outcomes</p>
        <span aria-live="polite" className="text-[11px] font-semibold text-smoke">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-smoke">
        Optional — what will students be able to do after this course?
      </p>
      <ul className="mt-3 space-y-2">
        {outcomes.map((outcome, index) => (
          <li
            key={`${outcome}-${index}`}
            className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-3 py-2"
          >
            <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
            <input
              value={outcome}
              disabled={disabled}
              onChange={(event) => {
                const next = [...outcomes];
                next[index] = event.target.value;
                commit(next);
              }}
              aria-label={`Outcome ${index + 1}`}
              className="w-full bg-transparent text-sm text-ink focus:outline-none"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => commit(outcomes.filter((_, i) => i !== index))}
              aria-label={`Remove outcome ${index + 1}`}
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink/20 text-smoke transition-colors hover:border-accent hover:text-accent"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addRow();
            }
          }}
          placeholder="e.g. Meter any scene without a light meter"
          aria-label="New learning outcome"
        />
        <button
          type="button"
          onClick={addRow}
          disabled={disabled || !draft.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-lime shadow-hard-xs transition-transform active:translate-y-0.5 active:shadow-none disabled:opacity-40"
          aria-label="Add outcome"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>
      {status === "error" ? (
        <p className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-accent-deep">
          {saveError}
          <button
            type="button"
            onClick={() => persist(outcomes)}
            className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-lime px-2 py-0.5 text-[10px] font-bold text-ink uppercase"
          >
            <RefreshCw className="size-3" aria-hidden="true" /> Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
