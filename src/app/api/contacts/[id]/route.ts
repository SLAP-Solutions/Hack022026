import { NextResponse } from "next/server";
import { getById, update, deleteItem } from "@/lib/cosmos";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contact = await getById("contacts", id, id);
        if (!contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }
        return NextResponse.json(contact);
    } catch (error) {
        console.error("Failed to fetch contact:", error);
        return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Update timestamp
        const contact = {
            ...body,
            id: id,
            updatedAt: new Date().toISOString(),
        };

        const result = await update("contacts", id, id, contact);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to update contact:", error);
        return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteItem("contacts", id, id);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
    }
}
