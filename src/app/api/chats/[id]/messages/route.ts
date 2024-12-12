import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await req.json();
    const chat = await db.chat.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Get bot response from Python backend
    const botResponse = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: message })
    });

    if (!botResponse.ok) {
      throw new Error('Failed to get bot response');
    }

    const { response } = await botResponse.json();

    const updatedChats = [
      ...(chat.chats as any[]),
      { role: 'USER', message },
      { role: 'BOT', message: response }
    ];

    const updatedChat = await db.chat.update({
      where: { id: parseInt(params.id) },
      data: { chats: updatedChats }
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 