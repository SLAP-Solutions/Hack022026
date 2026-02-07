locals {
  name = "hack-dev"
}

resource "azurecaf_name" "cosmos_account" {
  name          = local.name
  resource_type = "azurerm_cosmosdb_account"
  suffixes      = []
  clean_input   = true
}

resource "azurerm_cosmosdb_account" "hack_account" {
  name                       = azurecaf_name.cosmos_account.result
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  offer_type                 = "Standard"
  kind                       = "GlobalDocumentDB"
  free_tier_enabled          = true
  automatic_failover_enabled = true

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = "UKWest"
    failover_priority = 0
  }

  backup {
    type                = "Periodic"
    interval_in_minutes = 240
    retention_in_hours  = 8
    storage_redundancy  = "Geo"
  }

  tags = {
    defaultExperience = "Core (SQL)"
  }
}

resource "azurerm_cosmosdb_sql_database" "hack_database" {
  name                = local.name
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.hack_account.name
}

resource "azurerm_cosmosdb_sql_container" "hack_claims" {
  name                  = "claims"
  resource_group_name   = azurerm_resource_group.main.name
  account_name          = azurerm_cosmosdb_account.hack_account.name
  database_name         = azurerm_cosmosdb_sql_database.hack_database.name
  partition_key_version = 1
  partition_key_paths   = ["/Id"]

  conflict_resolution_policy {
    mode                     = "LastWriterWins"
    conflict_resolution_path = "/_ts"
  }

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "hack_payments" {
  name                  = "payments"
  resource_group_name   = azurerm_resource_group.main.name
  account_name          = azurerm_cosmosdb_account.hack_account.name
  database_name         = azurerm_cosmosdb_sql_database.hack_database.name
  partition_key_version = 1
  partition_key_paths   = ["/ClaimId"]

  conflict_resolution_policy {
    mode                     = "LastWriterWins"
    conflict_resolution_path = "/_ts"
  }

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }
}