resource "azurecaf_name" "rg" {
  name          = local.name
  resource_type = "azurerm_resource_group"
  prefixes      = []
  suffixes      = []
  clean_input   = true
}

resource "azurecaf_name" "webapp" {
  name          = local.name
  resource_type = "azurerm_linux_web_app"
  suffixes      = []
  clean_input   = true
}

resource "azurecaf_name" "app_service_plan" {
  name          = local.name
  resource_type = "azurerm_app_service_plan"
  suffixes      = []
  clean_input   = true
}

resource "azurerm_resource_group" "main" {
  name     = azurecaf_name.rg.result
  location = var.location

  tags = {
    Environment = "Development"
    Project     = "Hack022026"
  }
}

resource "azurerm_service_plan" "app_service_plan" {
  name                = azurecaf_name.app_service_plan.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"

  tags = {
    Environment = "Development"
    Project     = "Hack022026"
  }
}

resource "azurerm_linux_web_app" "webapp" {
  name                = azurecaf_name.webapp.result
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }

    # Use standalone server from Next.js build
    app_command_line = "node standalone/server.js"
    
    # Health check configuration
    health_check_path                 = "/api/health"
    health_check_eviction_time_in_min = 5
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    
    # Disable Oryx build - we're deploying a pre-built standalone app
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "ENABLE_ORYX_BUILD" = "false"
    
    "PORT" = "8080"
    "WEBSITES_PORT" = "8080"

    "NODE_ENV" = "production"
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    application_logs {
      file_system_level = "Information"
    }

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = {
    Environment = "Development"
    Project     = "Hack022026"
  }
}

