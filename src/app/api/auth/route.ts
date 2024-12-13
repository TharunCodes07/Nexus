import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password, name, isLogin } = await req.json();

    if (isLogin) {
      
      const user = await db.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { user: { id: user.id, name: user.name, email: user.email } },
        {
          headers: {
            'Set-Cookie': `userEmail=${user.email}; Path=/; HttpOnly; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } SameSite=Lax`
          }
        }
      );

    } else {
      
      const existingUser = await db.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        }
      });

      return NextResponse.json(
        { user: { id: user.id, name: user.name, email: user.email } },
        {
          headers: {
            'Set-Cookie': `userEmail=${user.email}; Path=/; HttpOnly; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } SameSite=Lax`
          }
        }
      );
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 