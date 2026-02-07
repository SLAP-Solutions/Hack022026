import { CosmosClient, Container, SqlQuerySpec } from "@azure/cosmos";

const databaseId = "hack";

// Lazy initialization to avoid build-time errors when env vars are not available
let client: CosmosClient | null = null;

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

function getContainer(containerName: string): Container {
  return getClient().database(databaseId).container(containerName);
}

const containerConfig = {
  claims: {
    partitionKey: "Id",
  },
  payments: {
    partitionKey: "ClaimId",
  },
} as const;

type ContainerName = keyof typeof containerConfig;

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
