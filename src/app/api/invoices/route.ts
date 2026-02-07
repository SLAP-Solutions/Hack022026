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

    // Generate a unique ID (e.g., CLM-TIMESTAMP-RANDOM)
    const id = `CLM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newClaim = {
      ...body,
      id,
      status: "pending",
      totalCost: 0,
      payments: [],
      dateCreated: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    const claim = await create("claims", newClaim);
    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Failed to create claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
