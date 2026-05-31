This doc is kept intentionally small and matches how the frontend uses Nominatim today.

## Frontend Contract

- Endpoint: `https://nominatim.openstreetmap.org/reverse`
- Method: `GET`
- Headers: `Accept-Language: vi`
- Query parameters used by the frontend:
  - `format=jsonv2`
  - `addressdetails=1`
  - `zoom=18`
  - `lat=<latitude>`
  - `lon=<longitude>`

## Used By

- [src/app/pages/warehouse/AddWarehouse.tsx](../app/pages/warehouse/AddWarehouse.tsx)
- [src/app/pages/warehouse/EditWarehouse.tsx](../app/pages/warehouse/EditWarehouse.tsx)

## Notes

- The frontend uses reverse geocoding to turn selected map coordinates into a Vietnamese address.
- The request is skipped if coordinates are unavailable.
layer	comma-separated list of: address, poi, railway, natural, manmade	unset (no restriction)
The layer filter allows to select places by themes.

The address layer contains all places that make up an address: address points with house numbers, streets, inhabited places (suburbs, villages, cities, states etc.) and administrative boundaries.

The poi layer selects all point of interest. This includes classic points of interest like restaurants, shops, hotels but also less obvious features like recycling bins, guideposts or benches.

The railway layer includes railway infrastructure like tracks. Note that in Nominatim's standard configuration, only very few railway features are imported into the database.

The natural layer collects features like rivers, lakes and mountains while the manmade layer functions as a catch-all for features not covered by the other layers.

Polygon output🔗
Parameter	Value	Default
polygon_geojson	0 or 1	0
polygon_kml	0 or 1	0
polygon_svg	0 or 1	0
polygon_text	0 or 1	0
Add the full geometry of the place to the result output. Output formats in GeoJSON, KML, SVG or WKT are supported. Only one of these options can be used at a time.

Parameter	Value	Default
polygon_threshold	floating-point number	0.0
When one of the polygon_* outputs is chosen, return a simplified version of the output geometry. The parameter describes the tolerance in degrees with which the geometry may differ from the original geometry. Topology is preserved in the geometry.

Other🔗
Parameter	Value	Default
email	valid email address	unset
If you are making large numbers of request please include an appropriate email address to identify your requests. See Nominatim's Usage Policy for more details.

Parameter	Value	Default
debug	0 or 1	0
Output assorted developer debug information. Data on internals of Nominatim's "search loop" logic, and SQL queries. The output is HTML format. This overrides the specified machine readable format.

Examples🔗
https://nominatim.openstreetmap.org/reverse?format=xml&lat=52.5487429714954&lon=-1.81602098644987&zoom=18&addressdetails=1
  <reversegeocode timestamp="Fri, 06 Nov 09 16:33:54 +0000" querystring="...">
    <result place_id="1620612" osm_type="node" osm_id="452010817">
      135, Pilkington Avenue, Wylde Green, City of Birmingham, West Midlands (county), B72, United Kingdom
    </result>
    <addressparts>
      <house_number>135</house_number>
      <road>Pilkington Avenue</road>
      <village>Wylde Green</village>
      <town>Sutton Coldfield</town>
      <city>City of Birmingham</city>
      <county>West Midlands (county)</county>
      <postcode>B72</postcode>
      <country>United Kingdom</country>
      <country_code>gb</country_code>
    </addressparts>
  </reversegeocode>
Example with format=jsonv2🔗
https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=-34.44076&lon=-58.70521
{
  "place_id":"134140761",
  "licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/www.openstreetmap.org\/copyright",
  "osm_type":"way",
  "osm_id":"280940520",
  "lat":"-34.4391708",
  "lon":"-58.7064573",
  "place_rank":"26",
  "category":"highway",
  "type":"motorway",
  "importance":"0.1",
  "addresstype":"road",
  "display_name":"Autopista Pedro Eugenio Aramburu, El Triángulo, Partido de Malvinas Argentinas, Buenos Aires, 1.619, Argentina",
  "name":"Autopista Pedro Eugenio Aramburu",
  "address":{
    "road":"Autopista Pedro Eugenio Aramburu",
    "village":"El Triángulo",
    "state_district":"Partido de Malvinas Argentinas",
    "state":"Buenos Aires",
    "postcode":"1.619",
    "country":"Argentina",
    "country_code":"ar"
  },
  "boundingbox":["-34.44159","-34.4370994","-58.7086067","-58.7044712"]
}
Example with format=geojson🔗
https://nominatim.openstreetmap.org/reverse?format=geojson&lat=44.50155&lon=11.33989
{
  "type": "FeatureCollection",
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "place_id": "18512203",
        "osm_type": "node",
        "osm_id": "1704756187",
        "place_rank": "30",
        "category": "place",
        "type": "house",
        "importance": "0",
        "addresstype": "place",
        "name": null,
        "display_name": "71, Via Guglielmo Marconi, Saragozza-Porto, Bologna, BO, Emilia-Romagna, 40122, Italy",
        "address": {
          "house_number": "71",
          "road": "Via Guglielmo Marconi",
          "suburb": "Saragozza-Porto",
          "city": "Bologna",
          "county": "BO",
          "state": "Emilia-Romagna",
          "postcode": "40122",
          "country": "Italy",
          "country_code": "it"
        }
      },
      "bbox": [
        11.3397676,
        44.5014307,
        11.3399676,
        44.5016307
      ],
      "geometry": {
        "type": "Point",
        "coordinates": [
          11.3398676,
          44.5015307
        ]
      }
    }
  ]
}
Example with format=geocodejson🔗
https://nominatim.openstreetmap.org/reverse?format=geocodejson&lat=60.2299&lon=11.1663

{
  "type": "FeatureCollection",
  "geocoding": {
    "version": "0.1.0",
    "attribution": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
    "licence": "ODbL",
    "query": "60.229917843587,11.16630979382"
  },
  "features": {
    "type": "Feature",
    "properties": {
      "geocoding": {
        "place_id": "42700574",
        "osm_type": "node",
        "osm_id": "3110596255",
        "type": "house",
        "accuracy": 0,
        "label": "1, Løvenbergvegen, Mogreina, Ullensaker, Akershus, 2054, Norway",
        "name": null,
        "housenumber": "1",
        "street": "Løvenbergvegen",
        "postcode": "2054",
        "county": "Akershus",
        "country": "Norway",
        "admin": {
          "level7": "Ullensaker",
          "level4": "Akershus",
          "level2": "Norway"
        }
      }
    },
    "geometry": {
      "type": "Point",
      "coordinates": [
        11.1658572,
        60.2301296
      ]
    }
  }
}