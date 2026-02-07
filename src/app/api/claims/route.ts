import { NextResponse } from "next/server";
import { getAll, create } from "@/lib/cosmos";

export async function GET() {
  try {
    const claims = await getAll("claims");
    return NextResponse.json(claims);
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const claim = await create("claims", body);
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Failed to create claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
