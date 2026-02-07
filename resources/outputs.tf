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
  value       = "https://${azurerm_linux_web_app.nextjs.default_hostname}"
  description = "The URL of the deployed Next.js application"
}

output "webapp_id" {
  value       = azurerm_linux_web_app.webapp.id
  description = "The ID of the Next.js web app"
}