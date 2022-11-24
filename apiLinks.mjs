export const municiPolygonDataAPI =
  "https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Acpv2020_municipios&maxFeatures=50&outputFormat=application%2Fjson&CQL_FILTER=cve_munc=15021";
export const statePolygonDataAPI =
  "https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Acpv2020_estados&maxFeatures=50&outputFormat=application%2Fjson&CQL_FILTER=cveent=14";

export const municipalitiesCatalog="https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Aapi-municipalities&maxFeatures=5000&outputFormat=application%2Fjson"
export const stateCatalog="https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Aapi-states&maxFeatures=50&outputFormat=application%2Fjson"