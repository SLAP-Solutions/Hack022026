import { NextRequest, NextResponse } from "next/server";

const AGENT_API_URL = process.env.AGENT_API_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        console.log(`Processing file: ${file.name} (${file.type})`);

        // Forward the file to the C# Agent API
        const agentFormData = new FormData();
        agentFormData.append("file", file);

        const agentResponse = await fetch(`${AGENT_API_URL}/agents/workflows/invoice/run`, {
            method: "POST",
            body: agentFormData,
        });

        if (!agentResponse.ok) {
            const errorData = await agentResponse.json().catch(() => ({}));
            console.error("Agent API error:", errorData);
            throw new Error(errorData.error || "Agent API request failed");
        }

        const result = await agentResponse.json();

        // Parse the agent response to extract structured data
        // The agent returns a natural language response, we'll extract key info
        const extractedData = parseAgentResponse(result.response, file.name);

        return NextResponse.json({
            success: true,
            data: extractedData,
            agentResponse: result.response
        });

    } catch (error) {
        console.error("Error processing invoice:", error);
        
        // Fallback to basic extraction if agent API fails
        const formData = await request.formData().catch(() => null);
        const file = formData?.get("file") as File | null;
        
        return NextResponse.json({
            success: false,
            error: "Failed to process invoice with AI agent",
            data: {
                title: file?.name?.split('.')[0] || "Invoice",
                description: "Document uploaded - manual review required",
                claimantName: "",
                type: "General"
            }
        }, { status: 500 });
    }
}

// Helper function to parse agent response into structured data
function parseAgentResponse(response: string, fileName: string): {
    title: string;
    description: string;
    claimantName: string;
    type: string;
} {
    // Default values
    let title = fileName.split('.')[0] || "Invoice";
    let description = "Extracted from uploaded document";
    let claimantName = "";
    let type = "General";

    if (!response) {
        return { title, description, claimantName, type };
    }

    // Try to extract client/claimant name
    const clientMatch = response.match(/client[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                        response.match(/claimant[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                        response.match(/name[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
    if (clientMatch) {
        claimantName = clientMatch[1].trim();
    }

    // Try to extract type
    const typeMatch = response.match(/type[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i) ||
                      response.match(/category[:\s]+([A-Za-z\s]+?)(?:\.|,|\n|$)/i);
    if (typeMatch) {
        type = typeMatch[1].trim();
    } else if (response.toLowerCase().includes("medical") || response.toLowerCase().includes("health")) {
        type = "Health";
    } else if (response.toLowerCase().includes("auto") || response.toLowerCase().includes("vehicle") || response.toLowerCase().includes("car")) {
        type = "Auto";
    } else if (response.toLowerCase().includes("home") || response.toLowerCase().includes("property")) {
        type = "Home";
    }

    // Try to extract title
    const titleMatch = response.match(/title[:\s]+([^\n]+?)(?:\.|,|\n|$)/i) ||
                       response.match(/invoice for[:\s]+([^\n]+?)(?:\.|,|\n|$)/i);
    if (titleMatch) {
        title = titleMatch[1].trim();
    } else {
        title = `${type} Invoice`;
    }

    // Use the full response as description if it's reasonable length
    if (response.length < 500) {
        description = response;
    } else {
        // Extract a summary
        const summaryMatch = response.match(/summary[:\s]+([^\n]+)/i) ||
                            response.match(/description[:\s]+([^\n]+)/i);
        if (summaryMatch) {
            description = summaryMatch[1].trim();
        }
    }

    return { title, description, claimantName, type };
}
