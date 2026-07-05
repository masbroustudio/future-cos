import { NextResponse } from "next/server";
import { readTasks, writeTasks } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const tasks = readTasks(username);
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const { tasks } = await req.json();
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: "Invalid tasks format" }, { status: 400 });
    }
    writeTasks(tasks, username);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
  }
}
