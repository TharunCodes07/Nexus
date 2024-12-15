import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId;
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const data = await db.data.findFirst({
      where: {
        chat_id: parseInt(chatId)
      }
    });

    if (!data) {
      return NextResponse.json({ files: [] });
    }

    return NextResponse.json({ files: data.files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
} 