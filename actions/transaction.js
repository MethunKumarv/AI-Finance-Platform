"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { transactionSchema } from "@/lib/schema";

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);
  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
}

export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    // Coerce date — client sends ISO string, server expects Date
    const parsed = transactionSchema.parse({
      ...data,
      date: new Date(data.date),
    });

    const account = await db.account.findUnique({
      where: { id: parsed.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    const amountFloat = parseFloat(parsed.amount);
    const balanceDelta =
      parsed.type === "EXPENSE" ? -amountFloat : amountFloat;

    const [transaction] = await db.$transaction([
      db.transaction.create({
        data: {
          type: parsed.type,
          amount: amountFloat,
          description: parsed.description || null,
          date: parsed.date,
          category: parsed.category,
          isRecurring: parsed.isRecurring,
          recurringInterval: parsed.isRecurring
            ? parsed.recurringInterval
            : null,
          nextRecurringDate:
            parsed.isRecurring && parsed.recurringInterval
              ? calculateNextRecurringDate(parsed.date, parsed.recurringInterval)
              : null,
          accountId: parsed.accountId,
          userId: user.id,
          status: "COMPLETED",
        },
      }),
      db.account.update({
        where: { id: parsed.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/account/${parsed.accountId}`);

    // Serialize Decimal fields before returning to client
    const serialized = {
      ...transaction,
      amount: transaction.amount.toNumber(),
    };

    return { success: true, data: serialized };
  } catch (error) {
    throw new Error(error.message);
  }
}
