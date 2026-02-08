import { NextRequest, NextResponse } from "next/server";
import { getById, update } from "@/lib/cosmos";

/**
 * POST /api/invoices/[id]/payments
 * 
 * Adds a pending payment to an invoice. This endpoint is designed for the agent API
 * to create payments that require manual user signing before execution.
 * 
 * The payment is created with status "pending_signature" - the user must then
 * sign and submit the transaction themselves through the UI.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    if (!body.usdAmount || body.usdAmount <= 0) {
      return NextResponse.json(
        { error: "USD amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Fetch the invoice to verify it exists and belongs to the wallet
    const invoice = await getById("invoices", invoiceId, invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify the invoice belongs to the requesting wallet
    // Normalize both to lowercase for comparison (wallet addresses are case-insensitive)
    if (invoice.walletId?.toLowerCase() !== body.walletId?.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized: Invoice does not belong to this wallet" },
        { status: 403 }
      );
    }

    // Generate a unique payment ID for this pending payment
    // Using a string ID since this payment hasn't been submitted to the blockchain yet
    const paymentId = `PENDING-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create the pending payment object
    // This payment requires user signing before it can be executed
    const pendingPayment = {
      id: paymentId,
      // Payment details
      payer: body.walletId, // The wallet that will sign this payment
      receiver: body.receiver || "0x0000000000000000000000000000000000000001", // Placeholder if not provided
      usdAmount: body.usdAmount, // Amount in cents (e.g., 10000 = $100.00)
      cryptoFeedId: body.cryptoFeedId || "ETH/USD",
      // Trigger settings - defaults for agent-created payments
      stopLossPrice: body.stopLossPrice || BigInt(0),
      takeProfitPrice: body.takeProfitPrice || BigInt(0),
      collateralAmount: body.collateralAmount || BigInt(0),
      expiryDays: body.expiryDays || 30,
      // Status - this is the key field that indicates it needs signing
      status: "pending_signature" as const,
      executed: false,
      // Timestamps
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
      createdAtPrice: BigInt(0),
      expiresAt: BigInt(0),
      executedAt: BigInt(0),
      executedPrice: BigInt(0),
      paidAmount: BigInt(0),
      // Metadata
      description: body.description || "",
      paymentType: body.paymentType || "trigger", // Default to trigger for agent payments
      // Track that this was created by the agent
      createdByAgent: true,
      agentCreatedAt: new Date().toISOString(),
    };

    // Add the payment to the invoice's payments array
    const existingPayments = invoice.payments || [];
    const updatedInvoice = {
      ...invoice,
      payments: [...existingPayments, pendingPayment],
    };

    // Update the invoice in Cosmos DB
    const result = await update("invoices", invoiceId, invoiceId, updatedInvoice);

    return NextResponse.json({
      success: true,
      payment: pendingPayment,
      invoiceId: invoiceId,
      message: "Payment added to invoice. User must sign the transaction to execute.",
    }, { status: 201 });

  } catch (error) {
    console.error("Failed to add payment to invoice:", error);
    return NextResponse.json(
      { error: "Failed to add payment to invoice" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/[id]/payments
 * 
 * Retrieves all payments for an invoice, optionally filtered by status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const walletId = searchParams.get("walletId");
    const status = searchParams.get("status"); // Optional filter: "pending_signature", "pending", "executed", etc.

    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    const invoice = await getById("invoices", invoiceId, invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // SECURITY: Verify the invoice belongs to the requesting wallet
    // Normalize both to lowercase for comparison (wallet addresses are case-insensitive)
    if (invoice.walletId?.toLowerCase() !== walletId?.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized: Invoice does not belong to this wallet" },
        { status: 403 }
      );
    }

    let payments = invoice.payments || [];

    // Filter by status if provided
    if (status) {
      payments = payments.filter((p: any) => p.status === status);
    }

    return NextResponse.json({
      invoiceId,
      payments,
      total: payments.length,
    });

  } catch (error) {
    console.error("Failed to fetch invoice payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice payments" },
      { status: 500 }
    );
  }
}
