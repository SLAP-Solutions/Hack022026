resource "azurerm_dns_a_record" "apex" {
  name                = "@"
  zone_name           = "slapsure.com"
  resource_group_name = "rg-hack-bootstrap"
  ttl                 = 300
  target_resource_id  = azurerm_static_web_app.hack.id
}
