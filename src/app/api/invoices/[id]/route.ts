import { NextRequest, NextResponse } from "next/server";
import { getById, update, deleteItem } from "@/lib/cosmos";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");

    // SECURITY: Require walletId for verification
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Use id as partition key (current DB schema)
    const invoice = await getById("invoices", id, id);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // SECURITY: Verify the invoice belongs to the requesting wallet
    if (invoice.walletId !== walletId) {
      return NextResponse.json(
        { error: "Unauthorized: Invoice does not belong to this wallet" },
        { status: 403 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // SECURITY: Require walletId for verification
    if (!body.walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // First, fetch the existing invoice to verify ownership
    const existingInvoice = await getById("invoices", id, id);

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // SECURITY: Verify the invoice belongs to the requesting wallet
    if (existingInvoice.walletId !== body.walletId) {
      return NextResponse.json(
        { error: "Unauthorized: Invoice does not belong to this wallet" },
        { status: 403 }
      );
    }

    // Use id as partition key (current DB schema)
    const result = await update("invoices", id, id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");

    // SECURITY: Require walletId for verification
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // First, fetch the existing invoice to verify ownership
    const existingInvoice = await getById("invoices", id, id);

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // SECURITY: Verify the invoice belongs to the requesting wallet
    if (existingInvoice.walletId !== walletId) {
      return NextResponse.json(
        { error: "Unauthorized: Invoice does not belong to this wallet" },
        { status: 403 }
      );
    }

    // Use id as partition key (current DB schema)
    await deleteItem("invoices", id, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
