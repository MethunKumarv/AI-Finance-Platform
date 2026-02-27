"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj)=>{
    const serialized= {...obj};
    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }
    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
};

export async function createAccount(data){
    try{
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized"); 
        const user=await db.user.findUnique({
            where:{clerkUserId:userId},
        });
        if(!user){
            throw new Error("User not found");
        }
        const balanceFloat = parseFloat(data.balance)
        if(isNaN(balanceFloat)){
            throw new Error("Invalid balance amount");
        }
        const existingAccounts = await db.account.findMany({
            where: { userId: user.id },
        });
        const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;
        if(shouldBeDefault){
            await db.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        }
        const account = await db.account.create({
            data: {
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            },
        });
        const serializedAccount = serializeTransaction(account);
        revalidatePath("/dashboard");
        return { success: true, data: serializedAccount };
    } catch (error){
        throw new Error(error.message);
    }
}

export async function getUserAccounts(){
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) {
            throw new Error("User not found");
        }
        const accounts = await db.account.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            include:{
                _count:{
                    select:{ transactions:true}
                }
            }
        });
        const serializedAccounts = accounts.map(serializeTransaction);
        return serializedAccounts;
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function updateDefaultAccount(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        
        if (!user) {
            throw new Error("User not found");
        }

        // Verify the account belongs to the user
        const account = await db.account.findFirst({
            where: { id: accountId, userId: user.id },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        // Set all accounts to non-default
        await db.account.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
        });

        // Set the selected account as default
        const updatedAccount = await db.account.update({
            where: { id: accountId },
            data: { isDefault: true },
        });

        revalidatePath("/dashboard");
        return { success: true, data: serializeTransaction(updatedAccount) };
    } catch (error) {
        throw new Error(error.message);
    }
}
