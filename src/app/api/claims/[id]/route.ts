import { NextResponse } from "next/server";
import { getById } from "@/lib/cosmos";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claim = await getById("claims", id, id);
    
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    
    return NextResponse.json(claim);
  } catch (error) {
    console.error("Failed to fetch claim:", error);
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 });
  }
}
