import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
  req: Request,
  { params }: { params: { chatId: string, fileName: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Delete file from filesystem
    const filePath = path.join(
      process.cwd(), 
      'public', 
      'chats', 
      params.chatId,
      params.fileName
    );

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file doesn't exist
    }

    // Update Data record to remove file reference
    const data = await db.data.findFirst({
      where: { chat_id: parseInt(params.chatId) }
    });

    if (data) {
      const currentFiles = data.files as any[];
      const updatedFiles = currentFiles.filter(
        file => file.name !== params.fileName && file.file_url !== `/chats/${params.chatId}/${params.fileName}`
      );

      await db.data.update({
        where: { id: data.id },
        data: { files: updatedFiles }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
} 