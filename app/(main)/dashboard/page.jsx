import { getUserAccounts } from "@/actions/dashboard";
import CreateAccountDrawer from "@/components/crete-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BarChart3 } from "lucide-react";
import AccountCard from "@/app/(main)/dashboard/_components/account-card";
import Link from "next/link";

async function DashboardPage(){
  const accounts = await getUserAccounts();


  return <div className="px-5">
    <div className="mb-6">
      <Link href="/insights">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">View Financial Insights →</span>
        </div>
      </Link>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
                <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
                    <Plus className="h-10 w-10 mb-2"/>
                    <p className="text-sm font-medium">Add New Account</p>
                </CardContent>
            </Card>
        </CreateAccountDrawer>

        {accounts.length > 0 &&
        accounts?.map((account) =>{
          return <AccountCard key={account.id} account={account} />
        })}
    </div>

  </div>;
}
export default DashboardPage;