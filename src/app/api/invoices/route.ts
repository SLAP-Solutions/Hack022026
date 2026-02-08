import { NextRequest, NextResponse } from "next/server";
import { getAll, create, query } from "@/lib/cosmos";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");

    // SECURITY: Require walletId to prevent retrieving invoices from other wallets
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Only retrieve invoices for the specified wallet - ensures data isolation
    const invoices = await query("invoices", {
      query: "SELECT * FROM c WHERE c.walletId = @walletId",
      parameters: [{ name: "@walletId", value: walletId }]
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure walletId is present
    if (!body.walletId) {
      return NextResponse.json({ error: "Wallet ID is required" }, { status: 400 });
    }

    // Generate a unique ID (e.g., INV-TIMESTAMP-RANDOM)
    const id = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newInvoice = {
      ...body,
      walletId: body.walletId.toLowerCase(),
      id,
      status: "pending",
      totalCost: 0,
      payments: [],
      dateCreated: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    const invoice = await create("invoices", newInvoice);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
