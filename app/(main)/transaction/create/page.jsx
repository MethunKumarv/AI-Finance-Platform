import { getUserAccounts } from "@/actions/dashboard";
import TransactionForm from "./_components/transaction-form";

export default async function CreateTransactionPage() {
  const accounts = await getUserAccounts();
  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Transaction</h1>
      <TransactionForm
        accounts={accounts}
        defaultAccountId={defaultAccount?.id}
      />
    </div>
  );
}
