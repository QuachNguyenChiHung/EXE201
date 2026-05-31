This doc is kept intentionally small and matches how the frontend uses Nominatim today.

## Frontend Contract

- Endpoint: `https://nominatim.openstreetmap.org/search`
- Method: `GET`
- Headers: `Accept-Language: vi`
- Query parameters used by the frontend:
  - `format=jsonv2`
  - `addressdetails=1`
  - `countrycodes=vn`
  - `limit=5`
  - `street=<house number + street>`
  - `city=<city>`
  - `state=<state>`

## Used By

- [src/app/pages/warehouse/AddWarehouse.tsx](../app/pages/warehouse/AddWarehouse.tsx)
- [src/app/pages/warehouse/EditWarehouse.tsx](../app/pages/warehouse/EditWarehouse.tsx)

## Notes

- The frontend uses structured search, not the free-form `q` parameter.
- If all of `street`, `city`, and `state` are empty, the request is skipped.
      "postcode": "13347",
      "road": "Lindower Straße",
      "shop": "Ditsch",
      "suburb": "Wedding"
    },
    "addresstype": "shop",
    "boundingbox": [
      "52.5427201",
      "52.5427654",
      "13.3668619",
      "13.3669442"
    ],
    "category": "shop",
    "display_name": "Ditsch, Lindower Straße, Sprengelkiez, Wedding, Mitte, Berlin, 13347, Deutschland",
    "importance": 9.99999999995449e-06,
    "lat": "52.54274275",
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
    "lon": "13.36690305710228",
    "name": "Ditsch",
    "osm_id": 437595031,
    "osm_type": "way",
    "place_id": 204751033,
    "place_rank": 30,
    "type": "bakery"
  }
]
GeoJSON🔗
https://nominatim.openstreetmap.org/search?q=17+Strada+Pictor+Alexandru+Romano%2C+Bukarest&format=geojson

{
  "type": "FeatureCollection",
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "place_id": "35811445",
        "osm_type": "node",
        "osm_id": "2846295644",
        "display_name": "17, Strada Pictor Alexandru Romano, Bukarest, Bucharest, Sector 2, Bucharest, 023964, Romania",
        "place_rank": "30",
        "category": "place",
        "type": "house",
        "importance": 0.62025
      },
      "bbox": [
        26.1156689,
        44.4354754,
        26.1157689,
        44.4355754
      ],
      "geometry": {
        "type": "Point",
        "coordinates": [
          26.1157189,
          44.4355254
        ]
      }
    }
  ]
}
GeocodeJSON🔗
https://nominatim.openstreetmap.org/search?q=%CE%91%CE%B3%CE%AF%CE%B1+%CE%A4%CF%81%CE%B9%CE%AC%CE%B4%CE%B1%2C+%CE%91%CE%B4%CF%89%CE%BD%CE%B9%CE%B4%CE%BF%CF%82%2C+Athens%2C+Greece&format=geocodejson

{
  "type": "FeatureCollection",
  "geocoding": {
    "version": "0.1.0",
    "attribution": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
    "licence": "ODbL",
    "query": "Αγία Τριάδα, Αδωνιδος, Athens, Greece"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "geocoding": {
          "type": "place_of_worship",
          "label": "Αγία Τριάδα, Αδωνιδος, Άγιος Νικόλαος, 5º Δημοτικό Διαμέρισμα Αθηνών, Athens, Municipality of Athens, Regional Unit of Central Athens, Region of Attica, Attica, 11472, Greece",
          "name": "Αγία Τριάδα",
          "admin": null
        }
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          23.72949633941,
          38.0051697
        ]
      }
    }
  ]
}