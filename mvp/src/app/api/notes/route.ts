import { NextResponse } from "next/server";
import { readNotes, writeNotes } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const notes = readNotes(username);
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const username = req.headers.get("x-username") || "default";
    const { notes } = await req.json();
    
    if (notes === undefined || notes === null) {
      return NextResponse.json({ error: "Missing notes content" }, { status: 400 });
    }
    
    writeNotes(notes, username);
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save project notes" }, { status: 500 });
  }
}
