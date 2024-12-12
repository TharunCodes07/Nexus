import { cookies } from "next/headers";
import { db } from "./db";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('userEmail')?.value;
    
    if (!userEmail) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, email: true }
    });

    return user;
  } catch (error) {
    return null;
  }
}