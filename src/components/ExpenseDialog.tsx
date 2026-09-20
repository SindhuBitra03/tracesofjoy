import { useEffect, useState } from "react";
import { CATEGORIES, type Expense, type ExpenseInput } from "@/lib/expenses";

type Props = {
  open: boolean;
  expense: Expense | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => void;
};

export function ExpenseDialog({ open, expense, saving, onClose, onSubmit }: Props) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setDate(expense?.date ?? new Date().toISOString().slice(0, 10));
    setAmount(expense ? String(expense.amount) : "");
    setCategory(expense?.category ?? CATEGORIES[0]);
    setDescription(expense?.description ?? "");
  }, [open, expense]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number.parseFloat(amount);
    if (!date || Number.isNaN(value) || value <= 0) {
      setError("Please enter a valid date and a positive amount.");
      return;
    }
    onSubmit({ date, amount: value, category, description: description.trim() });
  };

  const fieldClass =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="neon-panel neon-glow-lg w-full max-w-md overflow-hidden">
        <div className="border-b border-border bg-background/60 px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary">
          {expense ? "Edit expense" : "Add expense"}
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <label htmlFor="exp-date" className="mb-1.5 block text-xs font-semibold">
              Date
            </label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label htmlFor="exp-amount" className="mb-1.5 block text-xs font-semibold">
              Amount
            </label>
            <input
              id="exp-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label htmlFor="exp-category" className="mb-1.5 block text-xs font-semibold">
              Category
            </label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="exp-desc" className="mb-1.5 block text-xs font-semibold">
              Description
            </label>
            <textarea
              id="exp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional note"
              className={fieldClass}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/15 p-3 text-center text-xs font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-border bg-secondary py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neon-glow w-full rounded-xl bg-primary py-2.5 text-xs font-extrabold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : expense ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
