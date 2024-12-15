import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir, unlink } from 'fs/promises';
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

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Create buffer from file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Setup file path
        const publicDir = path.join(process.cwd(), 'public', 'chat');
        const filePath = path.join(publicDir, file.name);

        // Ensure directory exists
        await mkdir(publicDir, { recursive: true });

        // Save the file
        await writeFile(filePath, buffer);

        try {
            // Call the FastAPI endpoint with just the filename and wait for response
            const controller = new AbortController();
            const response = await fetch('http://localhost:8000/video2word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: file.name
                }),
                // Set longer timeout for video processing
                signal: controller.signal,

            });

            if (!response.ok) {
                throw new Error('Failed to convert video');
            }

            const data = await response.json();
            return NextResponse.json(data);

        } finally {
            // Clean up the file regardless of success/failure
            try {
                await unlink(filePath);
            } catch (deleteError) {
                console.error('Error deleting file:', deleteError);
            }
        }

    } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            return NextResponse.json(
                { error: "Video processing timed out" },
                { status: 504 }
            );
        }
        console.error('Video conversion error:', error);
        return NextResponse.json(
            { error: "Failed to process video" },
            { status: 500 }
        );
    }
}

// Update the config to allow for longer processing time
export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
        externalResolver: true,
        bodyLimit: "50mb",
    },
};