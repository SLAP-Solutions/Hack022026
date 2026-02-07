
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

async function init() {
    console.log("Initializing database...");

    try {
        // Contacts: /id
        const { container: contactsContainer } = await database.containers.createIfNotExists({
            id: "contacts",
            partitionKey: "/id"
        });
        console.log(`Container '${contactsContainer.id}' created or already exists.`);

        // Invoices: /walletId
        const { container: invoicesContainer } = await database.containers.createIfNotExists({
            id: "invoices",
            partitionKey: "/walletId"
        });
        console.log(`Container '${invoicesContainer.id}' created or already exists.`);

        // Payments: /ClaimId
        const { container: paymentsContainer } = await database.containers.createIfNotExists({
            id: "payments",
            partitionKey: "/ClaimId"
        });
        console.log(`Container '${paymentsContainer.id}' created or already exists.`);
    } catch (error) {
        console.error("Error initializing container:", error);
    }
}

init();
