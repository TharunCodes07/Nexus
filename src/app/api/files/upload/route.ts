import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = await Promise.resolve(formData.get('chatId') as string);

    if (!file) {
      throw new Error('No file provided');
    }

    // Create chat folder if it doesn't exist
    const chatFolder = path.join(process.cwd(), 'public', 'chats', chatId);
    try {
      await fs.access(chatFolder);
    } catch {
      await fs.mkdir(chatFolder, { recursive: true });
    }

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(chatFolder, file.name);
    await fs.writeFile(filePath, buffer);

    // Update or create Data record
    const existingData = await db.data.findFirst({
      where: { chat_id: parseInt(chatId) }
    });

    const fileData = {
      file_url: `/chats/${chatId}/${file.name}`,
      name: file.name
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
          chat_id: parseInt(chatId),
          files: [fileData]
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      filePath: `/chats/${chatId}/${file.name}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 