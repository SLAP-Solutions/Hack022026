import { CosmosClient, SqlQuerySpec } from "@azure/cosmos";

const endpoint = process.env.COSMOSDB_ENDPOINT!;
const key = process.env.COSMOSDB_KEY!;
const databaseId = "hack";

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

export const containers = {
  claims: {
    container: database.container("claims"),
    partitionKey: "Id",
  },
  payments: {
    container: database.container("payments"),
    partitionKey: "ClaimId",
  },
  contacts: {
    container: database.container("contacts"),
    partitionKey: "id",
  },
} as const;

export async function getAll(containerName: keyof typeof containers) {
  const { container } = containers[containerName];
  const { resources } = await container.items.readAll().fetchAll();
  return resources;
}

export async function getById(
  containerName: keyof typeof containers,
  id: string,
  partitionKeyValue: string
) {
  const { container } = containers[containerName];
  const { resource } = await container.item(id, partitionKeyValue).read();
  return resource;
}

export async function create(
  containerName: keyof typeof containers,
  item: Record<string, unknown>
) {
  const { container } = containers[containerName];
  const { resource } = await container.items.create(item);
  return resource;
}

export async function query(
  containerName: keyof typeof containers,
  querySpec: SqlQuerySpec
) {
  const { container } = containers[containerName];
  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources;
}

export async function update(
  containerName: keyof typeof containers,
  id: string,
  partitionKeyValue: string,
  item: Record<string, unknown>
) {
  const { container } = containers[containerName];
  const { resource } = await container.item(id, partitionKeyValue).replace(item);
  return resource;
}

export async function deleteItem(
  containerName: keyof typeof containers,
  id: string,
  partitionKeyValue: string
) {
  const { container } = containers[containerName];
  await container.item(id, partitionKeyValue).delete();
}
