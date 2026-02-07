
// @ts-nocheck
// Ensure environment variables are loaded
require("dotenv").config({ path: ".env.local" });

const { CosmosClient } = require("@azure/cosmos");
const fs = require('fs');
const path = require('path');

const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseId = "hack";

if (!endpoint || !key) {
    console.error("Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY");
    process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container("claims");

async function seedClaims() {
    console.log("Seeding claims container...");
    console.log("CWD:", process.cwd());

    try {
        const claimsPath = path.join(process.cwd(), 'src', 'data', 'claims.json');
        console.log(`Reading claims from: ${claimsPath}`);

        if (!fs.existsSync(claimsPath)) {
            console.error(`Claims file not found at: ${claimsPath}`);
            return;
        }

        const fileContent = fs.readFileSync(claimsPath, 'utf8');
        const claimsData = JSON.parse(fileContent);
        console.log(`Found ${claimsData.length} claims in JSON.`);

        const claimsToInsert = claimsData.map(claim => {
            return {
                ...claim,
                id: claim.id,
                payments: (claim.payments || []).map(p => ({
                    ...p,
                    id: p.id,
                    payer: p.payer || "0x0000000000000000000000000000000000000000",
                    receiver: p.receiver || "",
                    usdAmount: p.usdAmount || 0,
                    cryptoFeedId: p.cryptoFeedId || "0x",
                    stopLossPrice: p.stopLossPrice || 0,
                    takeProfitPrice: p.takeProfitPrice || 0,
                    collateralAmount: p.collateralAmount ? String(p.collateralAmount) : "0",

                    // Convert dates to BigInt strings
                    createdAt: claim.dateCreated ? String(Math.floor(new Date(claim.dateCreated).getTime() / 1000)) : "0",
                    expiresAt: p.expiresAt ? String(Math.floor(new Date(p.expiresAt).getTime() / 1000)) : "0",

                    executed: p.status === 'executed',
                    executedAt: p.executedAt ? String(Math.floor(new Date(p.executedAt).getTime() / 1000)) : "0",
                    executedPrice: "0",
                    paidAmount: "0",
                }))
            };
        });

        console.log(`Prepared ${claimsToInsert.length} claims for insertion.`);

        let successCount = 0;
        for (const claim of claimsToInsert) {
            try {
                await container.items.upsert(claim);
                successCount++;
                if (successCount % 5 === 0) process.stdout.write(`Inserted ${successCount}... `);
            } catch (err: any) {
                console.error(`\nFailed to insert claim ${claim.id}:`, err.message);
            }
        }

        console.log(`\nSuccessfully seeded ${successCount} claims.`);
    } catch (error: any) {
        console.error("Error seeding claims:", error.message);
    }
}

seedClaims();
