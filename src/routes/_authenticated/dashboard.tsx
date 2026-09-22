import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { ExpenseDialog } from "@/components/ExpenseDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  categoryBadgeClass,
  createExpense,
  deleteExpense,
  fetchExpenses,
  formatCurrency,
  formatDisplayDate,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Expense Tracker" },
      { name: "description", content: "Your spending dashboard: totals, category analytics and expense history." },
      { property: "og:title", content: "Dashboard — Expense Tracker" },
      { property: "og:description", content: "Totals, category analytics and your full expense history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = [
  "oklch(0.79 0.14 197)",
  "oklch(0.72 0.16 250)",
  "oklch(0.78 0.16 330)",
  "oklch(0.8 0.15 85)",
  "oklch(0.75 0.15 150)",
  "oklch(0.7 0.18 25)",
  "oklch(0.74 0.14 300)",
  "oklch(0.7 0.03 260)",
];

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = Route.useRouteContext();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const saveMutation = useMutation({
    mutationFn: async (input: ExpenseInput) =>
      editing ? updateExpense(editing.id, input) : createExpense(input),
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? "Expense updated" : "Expense added");
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not save expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Expense deleted");
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete expense"),
  });

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const metrics = useMemo(() => {
    const todayTotal = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
    const monthTotal = expenses
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return { todayTotal, monthTotal, total, count: expenses.length };
  }, [expenses, today, thisMonth]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses.filter((e) => e.date.startsWith(thisMonth))) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses, thisMonth]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      if (monthFilter && !e.date.startsWith(monthFilter)) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    });
  }, [expenses, search, categoryFilter, monthFilter]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    toast.success("Logged out successfully");
    void navigate({ to: "/" });
  };

  const fieldClass =
    "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="min-h-screen">
      <header className="neon-panel sticky top-0 z-30 rounded-none border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="neon-glow flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">Traces of Joy</h1>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="neon-glow flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={CalendarDays} label="Spent today" value={formatCurrency(metrics.todayTotal)} />
          <MetricCard icon={TrendingUp} label="This month" value={formatCurrency(metrics.monthTotal)} />
          <MetricCard icon={Wallet} label="All time" value={formatCurrency(metrics.total)} />
          <MetricCard icon={Search} label="Records" value={String(metrics.count)} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="neon-panel p-5 lg:col-span-1">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
              This month by category
            </h2>
            {byCategory.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted-foreground">No spending this month yet.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                      {byCategory.map((entry, i) => (
                        <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 space-y-1.5">
              {byCategory.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <span className="font-semibold">{formatCurrency(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="neon-panel overflow-hidden lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses"
                  className={`${fieldClass} pl-9`}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={fieldClass}
              >
                <option value="ALL">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="max-h-[28rem] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-background/90 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        Loading expenses…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        No expenses match your filters yet.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e) => (
                      <tr key={e.id} className="neon-row border-b border-border/60">
                        <td className="px-4 py-3.5 font-medium">{formatDisplayDate(e.date)}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${categoryBadgeClass(e.category)}`}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3.5 text-muted-foreground">
                          {e.description || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-primary">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditing(e);
                                setDialogOpen(true);
                              }}
                              className="rounded-lg border border-border p-1.5 transition-colors hover:bg-accent"
                              aria-label="Edit expense"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setPendingDelete(e)}
                              className="rounded-lg border border-destructive/40 p-1.5 text-destructive transition-colors hover:bg-destructive/15"
                              aria-label="Delete expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
              <span className="text-muted-foreground">{filtered.length} shown</span>
              <span className="font-bold text-primary">{formatCurrency(filteredTotal)}</span>
            </div>
          </div>
        </section>
      </main>

      <ExpenseDialog
        open={dialogOpen}
        expense={editing}
        saving={saveMutation.isPending}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => saveMutation.mutate(input)}
      />

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="neon-panel neon-glow-lg w-full max-w-sm p-6 text-center">
            <h2 className="text-sm font-bold">Delete this expense?</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatDisplayDate(pendingDelete.date)} · {pendingDelete.category} ·{" "}
              {formatCurrency(pendingDelete.amount)}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="w-full rounded-xl border border-border bg-secondary py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                className="w-full rounded-xl bg-destructive py-2.5 text-xs font-extrabold uppercase tracking-wider text-destructive-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="neon-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
