import { NextResponse } from "next/server";
import { getById, update, deleteItem } from "@/lib/cosmos";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const claim = {
      ...body,
      id,
      // Ensure updatedAt is updated if not passed or just force update it?
      // Usually good to force update it if tracking modification time
      // But for embedded arrays (payments), we might want to preserve other fields
      // The store should pass the full object.
    };

    // We don't overwrite updatedAt here to allow store to manage it? 
    // Or we should? Contacts route creates new Date().
    // Let's stick to consistent pattern: server updates timestamp?
    // But if store updates payment status, 'updatedAt' of claim should change.
    // Let's add updatedAt.

    const updatedClaim = {
      ...claim,
      updatedAt: new Date().toISOString() // Assuming Claim has updatedAt field?
      // Wait, Claim interface in types/claim.ts DOES NOT have updatedAt!
      // It has dateCreated and dateSettled.
      // So I shouldn't add updatedAt unless I add it to type.
      // I'll skip updatedAt for now to match type or check type again.
    };

    // Check types/claim.ts content from step 439:
    // export interface Claim { id... dateCreated... dateSettled... }
    // No updatedAt.

    const result = await update("claims", id, id, body); // Just update with body
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteItem("claims", id, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete claim:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}
