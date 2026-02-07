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

output "webapp_name" {
  value       = azurerm_linux_web_app.webapp.name
  description = "The name of the Next.js web app"
}

output "webapp_url" {
  value       = "https://${azurerm_linux_web_app.webapp.default_hostname}"
  description = "The URL of the deployed Next.js application"
}

output "webapp_id" {
  value       = azurerm_linux_web_app.webapp.id
  description = "The ID of the Next.js web app"
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