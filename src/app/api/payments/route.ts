import { NextResponse } from "next/server";
import { getAll, create, query } from "@/lib/cosmos";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get("claimId");

    if (claimId) {
      const payments = await query("payments", {
        query: "SELECT * FROM c WHERE c.ClaimId = @claimId",
        parameters: [{ name: "@claimId", value: claimId }],
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
    const payment = await create("payments", body);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
