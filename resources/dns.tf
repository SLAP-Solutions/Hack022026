# resource "azurerm_dns_cname_record" "onsomble_client_cname" {
#   name                = "slapsure"
#   zone_name           = "slapsure.co.uk"
#   resource_group_name = "rg-hack-bootstrap"
#   ttl                 = 300
#   record              = azurerm_static_web_app.hack.default_host_name
# }