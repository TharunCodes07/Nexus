import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import fs from 'fs/promises';
import path from 'path';
import { error } from "console";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { chatId, content, fileName, type } = await req.json();
    const resolvedChatId = await Promise.resolve(chatId);

    const chatFolder = path.join(process.cwd(), 'public', 'chats', resolvedChatId.toString());
    try {
      await fs.access(chatFolder);
    } catch {
      await fs.mkdir(chatFolder, { recursive: true });
    }

    // Save file content
    const filePath = path.join(chatFolder, fileName);
    await fs.writeFile(filePath, content);

    // Update or create Data record
    const existingData = await db.data.findFirst({
      where: { chat_id: parseInt(resolvedChatId) }
    });

    const fileData = {
      file_url: `/chats/${resolvedChatId}/${fileName}`,
      content,
      type,
      name: fileName
    };

    if (existingData) {
      const currentFiles = existingData.files as any[];
      await db.data.update({
        where: { id: existingData.id },
        data: {
          files: [...currentFiles, fileData]
        }
      });
    } else {
      await db.data.create({
        data: {
          chat_id: parseInt(resolvedChatId),
          files: [fileData]
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
} 