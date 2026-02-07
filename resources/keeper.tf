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

# Container Instance for keeper service
resource "azurecaf_name" "aci" {
  name          = "${local.name}-keeper"
  resource_type = "azurerm_container_group"
  clean_input   = true
}

resource "azurerm_container_group" "keeper" {
  name                = azurecaf_name.aci.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  restart_policy      = "Always"

  # Note: Image will be updated by GitHub Actions after build
  # Initial placeholder image - will be replaced on first deployment
  container {
    name   = "payment-keeper"
    image  = "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
    cpu    = "0.5"
    memory = "0.5"

    # Environment variables - set via GitHub Actions on deployment
    # These are placeholders and will be overridden
    environment_variables = {
      RPC_URL       = "https://coston2-api.flare.network/ext/C/rpc"
      POLL_INTERVAL = "15000"
      GAS_LIMIT     = "500000"
    }

    # Sensitive env vars are set separately in GitHub Actions
    # PRIVATE_KEY will be passed as secure environment variable during deployment
  }

  image_registry_credential {
    server   = azurerm_container_registry.keeper.login_server
    username = azurerm_container_registry.keeper.admin_username
    password = azurerm_container_registry.keeper.admin_password
  }

  tags = {
    Environment = "Development"
    Project     = "Hack022026"
    Component   = "Keeper"
  }

  depends_on = [
    azurerm_container_registry.keeper
  ]
}
