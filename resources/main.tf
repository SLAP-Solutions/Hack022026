resource "azurecaf_name" "rg" {
  name          = local.name
  resource_type = "azurerm_resource_group"
  prefixes      = []
  suffixes      = []
  clean_input   = true
}

resource "azurecaf_name" "static_web_app_hack" {
  name          = local.name
  resource_type = "azurerm_static_site"
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

resource "azurerm_static_web_app" "hack" {
  name                = azurecaf_name.static_web_app_hack.result
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  sku_tier            = "Free"
  sku_size            = "Free"
}

resource "azurerm_static_site_custom_domain" "apex" {
  static_site_id  = azurerm_static_web_app.hack.id
  domain_name     = "slapsure.com"
  validation_type = "dns-txt-token"
}
