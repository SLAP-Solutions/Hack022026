import { NextResponse } from "next/server";
import { getAll, create } from "@/lib/cosmos";

export async function GET() {
    try {
        const contacts = await getAll("contacts");
        return NextResponse.json(contacts);
    } catch (error) {
        console.error("Failed to fetch contacts:", error);
        return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Add timestamps
        const contact = {
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await create("contacts", contact);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Failed to create contact:", error);
        return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }
}
