import { supabase } from "@/integrations/supabase/client";

export type Expense = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Education",
  "Other",
] as const;

export type ExpenseInput = {
  date: string;
  amount: number;
  category: string;
  description: string;
};

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as Expense[];
}

export async function createExpense(input: ExpenseInput) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Not signed in");
  const { error } = await supabase
    .from("expenses")
    .insert({ ...input, user_id: userData.user.id });
  if (error) throw error;
}

export async function updateExpense(id: string, input: ExpenseInput) {
  const { error } = await supabase.from("expenses").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDisplayDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function categoryBadgeClass(category: string) {
  const map: Record<string, string> = {
    Food: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    Transport: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    Shopping: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30",
    Bills: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    Health: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    Entertainment: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    Education: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    Other: "bg-slate-500/15 text-slate-300 border-slate-400/30",
  };
  return map[category] ?? map["Other"]!;
}
