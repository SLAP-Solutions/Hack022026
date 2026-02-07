terraform {
  backend "azurerm" {
    resource_group_name  = "rg-hack-bootstrap"
    storage_account_name = "hacktfstate"
    
    container_name      = "tfstate"
    key                 = "webapp.tfstate"
  }
}