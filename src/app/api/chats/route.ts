import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const chats = await db.chat.findMany({
      where: { email: user.email },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(chats);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { summary } = await req.json();
    const chat = await db.chat.create({
      data: {
        summary,
        chats: [],
        email: user.email
      }
    });
    return NextResponse.json(chat);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
} 