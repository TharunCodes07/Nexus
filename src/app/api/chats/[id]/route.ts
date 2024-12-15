import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getCurrentUser } from "@/lib/auth";
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
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

    // Delete associated files from filesystem
    const chatFolder = path.join(
      process.cwd(),
      'public',
      'chats',
      params.id
    );

    try {
      await fs.rm(chatFolder, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting chat folder:', error);
      // Continue even if folder doesn't exist
    }

    // Delete associated Data records
    await db.data.deleteMany({
      where: { chat_id: parseInt(params.id) }
    });

    // Delete the chat
    await db.chat.delete({
      where: { 
        id: parseInt(params.id),
        email: user.email
      }
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
        email: user.email 
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
