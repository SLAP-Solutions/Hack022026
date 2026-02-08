output "resource_group_name" {
  value       = azurerm_resource_group.main.name
  description = "The CAF-compliant name of the resource group"
}

output "resource_group_id" {
  value       = azurerm_resource_group.main.id
  description = "The ID of the resource group"
}

output "resource_group_location" {
  value       = azurerm_resource_group.main.location
  description = "The location of the resource group"
}

output "static_web_app_name" {
  value       = azurerm_static_web_app.hack.name
  description = "The name of the Static Web App"
}

output "static_web_app_default_host_name" {
  value       = azurerm_static_web_app.hack.default_host_name
  description = "The default hostname of the Static Web App"
}

output "static_web_app_api_key" {
  value       = azurerm_static_web_app.hack.api_key
  description = "The API key for deploying to the Static Web App"
  sensitive   = true
}

# Keeper Container Registry outputs
output "keeper_registry_login_server" {
  value       = azurerm_container_registry.keeper.login_server
  description = "The login server URL for the keeper container registry"
}

output "keeper_registry_name" {
  value       = azurerm_container_registry.keeper.name
  description = "The name of the keeper container registry"
}

output "keeper_registry_username" {
  value       = azurerm_container_registry.keeper.admin_username
  description = "The admin username for the keeper container registry"
  sensitive   = true
}

output "keeper_registry_password" {
  value       = azurerm_container_registry.keeper.admin_password
  description = "The admin password for the keeper container registry"
  sensitive   = true
}

output "keeper_container_group_name" {
  value       = azurecaf_name.aci.result
  description = "The name for the keeper container instance (created by GitHub Actions)"
}

output "keeper_fqdn" {
  value       = "${azurecaf_name.aci.result}.${azurerm_resource_group.main.location}.azurecontainer.io"
  description = "The expected FQDN of the keeper container (once created by GitHub Actions)"
}
