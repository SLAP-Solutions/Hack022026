
import { NextRequest, NextResponse } from "next/server";

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

        // Mock AI Agent Processing
        // In a real implementation, this would:
        // 1. Upload file to storage or send buffer to AI service (e.g., OpenAI, Azure Document Intelligence)
        // 2. Extract text/data using OCR/Vision model
        // 3. Map extracted data to our Invoice schema

        console.log(`Processing file: ${file.name} (${file.type})`);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock extracted data based on filename keywords for demonstration
        let extractedData = {
            title: "General Invoice",
            description: "Extracted from uploaded document",
            claimantName: "Unknown Client",
            type: "General"
        };

        const fileName = file.name.toLowerCase();

        if (fileName.includes("medical") || fileName.includes("hospital") || fileName.includes("doctor")) {
            extractedData = {
                title: "Medical Services Invoice",
                description: "Consultation and routine checkup services",
                claimantName: "John Doe",
                type: "Health"
            };
        } else if (fileName.includes("repair") || fileName.includes("auto") || fileName.includes("car")) {
            extractedData = {
                title: "Vehicle Repair Invoice",
                description: "Bumper replacement and paint work",
                claimantName: "Alice Smith",
                type: "Auto"
            };
        } else if (fileName.includes("home") || fileName.includes("property") || fileName.includes("roof")) {
            extractedData = {
                title: "Home Repair Invoice",
                description: "Roof leak repair and maintenance",
                claimantName: "Bob Jones",
                type: "Home"
            };
        }

        return NextResponse.json({
            success: true,
            data: extractedData
        });

    } catch (error) {
        console.error("Error processing invoice:", error);
        return NextResponse.json(
            { error: "Failed to process invoice" },
            { status: 500 }
        );
    }
}
