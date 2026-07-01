"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/lib/schema";
import { createTransaction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ReceiptUpload } from "@/components/receipt-upload";

const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "business",
  "investments",
  "gifts",
  "other_income",
];

const EXPENSE_CATEGORIES = [
  "housing",
  "transportation",
  "food",
  "utilities",
  "healthcare",
  "entertainment",
  "shopping",
  "education",
  "personal",
  "travel",
  "insurance",
  "debt",
  "savings",
  "groceries",
  "dining",
  "gas",
  "clothing",
  "gym",
  "phone",
  "internet",
  "streaming",
  "hobbies",
  "gifts_donations",
  "pets",
  "home_improvement",
  "childcare",
  "other_expense",
];

const RECURRING_INTERVALS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

function formatCategoryLabel(cat) {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TransactionForm({ accounts, defaultAccountId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: defaultAccountId || (accounts[0]?.id ?? ""),
      category: "",
      date: new Date(),
      isRecurring: false,
      recurringInterval: undefined,
    },
  });

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const description = watch("description");
  const amount = watch("amount");
  const currentCategory = watch("category");

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // AI categorization effect
  useEffect(() => {
    const suggestCategory = async () => {
      if (description?.trim() && amount && type) {
        setSuggestingCategory(true);
        try {
          const response = await fetch("/api/ai/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: description.trim(),
              amount: parseFloat(amount),
              type: type,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.category && data.confidence > 0.5) {
              setSuggestedCategory(data);
            } else {
              setSuggestedCategory(null);
            }
          }
        } catch (error) {
          console.error("Error getting category suggestion:", error);
        } finally {
          setSuggestingCategory(false);
        }
      } else {
        setSuggestedCategory(null);
      }
    };

    const timer = setTimeout(suggestCategory, 800); // Debounce
    return () => clearTimeout(timer);
  }, [description, amount, type]);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      // Serialize date for server action
      const payload = { ...values, date: values.date.toISOString() };
      const result = await createTransaction(payload);
      if (result.success) {
        toast.success("Transaction created successfully!");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Type</label>
        <Select
          value={type}
          onValueChange={(val) => {
            setValue("type", val);
            setValue("category", ""); // reset category on type change
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-xs text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("amount")}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Account */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Account</label>
        <Select
          value={watch("accountId")}
          onValueChange={(val) => setValue("accountId", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} (${acc.balance.toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.accountId && (
          <p className="text-xs text-destructive">{errors.accountId.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Category</label>
          {suggestedCategory && (
            <button
              type="button"
              onClick={() => {
                setValue("category", suggestedCategory.category);
                setSuggestedCategory(null);
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              {currentCategory === suggestedCategory.category ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Applied
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  AI suggests:{" "}
                  {formatCategoryLabel(suggestedCategory.category)}
                  {Math.round(suggestedCategory.confidence * 100)}%
                </>
              )}
            </button>
          )}
        </div>
        <Select
          value={currentCategory}
          onValueChange={(val) => setValue("category", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {formatCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => setValue("date", d || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <Input placeholder="Add a note..." {...register("description")} className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowReceiptUpload(!showReceiptUpload)}
            title="Upload receipt photo"
          >
            📸
          </Button>
        </div>
      </div>

      {/* Receipt Upload */}
      {showReceiptUpload && (
        <ReceiptUpload
          onExtract={(data) => {
            setValue("amount", data.amount.toString());
            setValue("description", data.description || data.merchant);
            if (data.category) {
              setValue("category", data.category);
            }
            if (data.date) {
              try {
                setValue("date", new Date(data.date));
              } catch (e) {
                console.log("Date parse error");
              }
            }
            setShowReceiptUpload(false);
          }}
          onClose={() => setShowReceiptUpload(false)}
        />
      )}

      {/* Recurring */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Recurring Transaction</p>
          <p className="text-xs text-muted-foreground">
            Set up automatic recurring schedule
          </p>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(val) => setValue("isRecurring", val)}
        />
      </div>

      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            value={watch("recurringInterval") ?? ""}
            onValueChange={(val) => setValue("recurringInterval", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              {RECURRING_INTERVALS.map((interval) => (
                <SelectItem key={interval} value={interval}>
                  {interval.charAt(0) + interval.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-xs text-destructive">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
