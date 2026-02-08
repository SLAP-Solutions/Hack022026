import { NextResponse } from "next/server";
import { getAll, create, query } from "@/lib/cosmos";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get("claimId");
    const walletId = searchParams.get("walletId");

    if (claimId) {
      const payments = await query("payments", {
        query: "SELECT * FROM c WHERE c.ClaimId = @claimId",
        parameters: [{ name: "@claimId", value: claimId }],
      });
      return NextResponse.json(payments);
    }

    if (walletId) {
      const payments = await query("payments", {
        query: "SELECT * FROM c WHERE c.walletId = @walletId",
        parameters: [{ name: "@walletId", value: walletId }],
      });
      return NextResponse.json(payments);
    }

    const payments = await getAll("payments");
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.receiver) {
      return NextResponse.json({ error: "Receiver address is required" }, { status: 400 });
    }
    if (!body.usdAmount || body.usdAmount <= 0) {
      return NextResponse.json({ error: "USD amount must be greater than 0" }, { status: 400 });
    }

    // Generate a unique ID (e.g., PAY-TIMESTAMP-RANDOM)
    const id = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newPayment = {
      id,
      payer: body.payer || "",
      receiver: body.receiver,
      usdAmount: body.usdAmount,
      cryptoFeedId: body.cryptoFeedId || "ETH/USD",
      stopLossPrice: body.stopLossPrice || 0,
      takeProfitPrice: body.takeProfitPrice || 0,
      collateralAmount: body.collateralAmount || "0",
      expiryDays: body.expiryDays || 30,
      walletId: body.walletId || "",
      claimId: body.claimId || "",
      status: "pending",
      executed: false,
      createdAt: new Date().toISOString(),
      executedAt: null,
      executedPrice: null,
      paidAmount: null,
      description: body.description || "",
      paymentType: body.paymentType || "trigger", // "trigger" or "instant"
    };

    const payment = await create("payments", newPayment);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
