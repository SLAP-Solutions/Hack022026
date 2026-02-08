# Container Registry for keeper Docker images
resource "azurecaf_name" "acr" {
  name          = local.name
  resource_type = "azurerm_container_registry"
  clean_input   = true
}

resource "azurerm_container_registry" "keeper" {
  name                = azurecaf_name.acr.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    Environment = "Development"
    Project     = "Hack022026"
    Component   = "Keeper"
  }
}

# Container Instance naming - GitHub Actions will create the actual container
resource "azurecaf_name" "aci" {
  name          = "${local.name}-keeper"
  resource_type = "azurerm_containerGroups"
  clean_input   = true
}

# Note: Container creation is handled by GitHub Actions to properly inject secrets
# Terraform only provides the naming convention via outputs
