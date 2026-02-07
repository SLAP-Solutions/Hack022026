
// Ensure environment variables are loaded
require("dotenv").config({ path: ".env.local" });

const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseId = "hack";

if (!endpoint || !key) {
    console.error("Missing COSMOSDB_ENDPOINT or COSMOSDB_KEY");
    process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

async function recreateClaims() {
    console.log("Recreating 'claims' container...");

    try {
        const container = database.container("claims");
        try {
            await container.delete();
            console.log("Deleted existing 'claims' container.");
        } catch (e: any) {
            if (e.code !== 404) {
                console.warn("Error deleting claims container (might not exist):", e.message);
            }
        }

        const { container: newContainer } = await database.containers.createIfNotExists({
            id: "claims",
            partitionKey: "/id"
        });
        console.log(`Container '${newContainer.id}' created successfully with PK /id.`);
    } catch (error) {
        console.error("Error recreating container:", error);
    }
}

recreateClaims();
