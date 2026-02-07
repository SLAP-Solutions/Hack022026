import { CosmosClient, SqlQuerySpec } from "@azure/cosmos";

// Lazy initialization to avoid build-time errors
let client: CosmosClient | null = null;
const databaseId = "hack";

function getClient(): CosmosClient {
  if (!client) {
    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;

    if (!endpoint || !key) {
      throw new Error("COSMOSDB_ENDPOINT and COSMOSDB_KEY environment variables are required");
    }

    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

export const containerConfig = {
  claims: {
    id: "claims",
    partitionKey: "id", // Changed from "Id" to "id"
  },
  payments: {
    id: "payments",
    partitionKey: "ClaimId",
  },
  contacts: {
    id: "contacts",
    partitionKey: "id",
  },
} as const;

export type ContainerName = keyof typeof containerConfig;

function getContainer(name: ContainerName) {
  const config = containerConfig[name];
  return getClient().database(databaseId).container(config.id);
}

export async function getAll(containerName: ContainerName) {
  const container = getContainer(containerName);
  const { resources } = await container.items.readAll().fetchAll();
  return resources;
}

export async function getById(
  containerName: ContainerName,
  id: string,
  partitionKeyValue: string
) {
  const container = getContainer(containerName);
  const { resource } = await container.item(id, partitionKeyValue).read();
  return resource;
}

export async function create(
  containerName: ContainerName,
  item: Record<string, unknown>
) {
  const container = getContainer(containerName);
  const { resource } = await container.items.create(item);
  return resource;
}

export async function query(
  containerName: ContainerName,
  querySpec: SqlQuerySpec
) {
  const container = getContainer(containerName);
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources;
}

export async function update(
  containerName: ContainerName,
  id: string,
  partitionKeyValue: string,
  item: Record<string, unknown>
) {
  const container = getContainer(containerName);
  const { resource } = await container.item(id, partitionKeyValue).replace(item);
  return resource;
}

export async function deleteItem(
  containerName: ContainerName,
  id: string,
  partitionKeyValue: string
) {
  const container = getContainer(containerName);
  await container.item(id, partitionKeyValue).delete();
}
