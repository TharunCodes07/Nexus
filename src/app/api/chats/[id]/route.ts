import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await db.chat.delete({
      where: { id: parseInt(params.id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { summary } = await req.json();
    const chat = await db.chat.update({
      where: { 
        id: parseInt(params.id),
        email: user.email // Ensure user owns this chat
      },
      data: { summary }
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
} 