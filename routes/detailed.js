var request = require('request');
var express = require('express');
var router = express.Router();

var APIKeys = require('../data/APIKeys.json');
var municipiosData = require('../data/municipios.json');

/* Get coordinates from query. */
function getCoordinatesFromQuery(error, response, body, callback) {
  var place = JSON.parse(body)
    var lat,
  lng;
  if (error == null && place.candidates != undefined) {
    if (place.candidates[0] != undefined) {
      lat = place.candidates[0].geometry.location.lat;
      lng = place.candidates[0].geometry.location.lng;
      callback(error, lat, lng);
    } else {
      callback('No existe el lugar', null, null);
    }
  } else {
    callback(error, null, null);
  }
};

/* Get city name and provincia from coordinates */
function getLocalityFromCoordinates(error, response, body, callback) {
  var place = JSON.parse(body);
  if (error == null && place.results != undefined) {
    var placeDetails = place.results[0].address_components;

    var placeDetails = place.results.find(function (a) {
        var muni = a.address_components.find(e => e.types[0] === "locality");
        var prov = a.address_components.find(e => e.types[0] === "administrative_area_level_2");
        if (muni && prov) {
          callback(error, muni.long_name, prov.long_name);
          return 'found';
        }
      });
  } else {
    callback(error, null, null);
  }
};

/* Get aemet json for data */
function getAemetDataURL(error, response, body, callback) {
  var url;
  try {
    var data = JSON.parse(body);
    if (data.datos) {
      url = data.datos;
    } else {
      error = 'Aemet URL for data not found';
    }
  } catch (e) {
    error = e;
  }
  callback(error, data.datos);
};

/* Get aemet data */
function getAemetWeatherData(error, response, body, callback) {
  var prevision;
  try {
    prevision = JSON.parse(body);
    if (response.statusCode != 200)
      throw 'Aemet data not found or was expired';
  } catch (e) {
    error = e;
    prevision = null;
  }
  callback(error, prevision);
};

/* GET detailed block. */
router.get('/', function (req, res, next) {
  let query = req.query.location;
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;

  if (query == undefined && latitude && longitude) { // The user has not provided a query, but we got the coordinates
    var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + APIKeys.google_places_api_key;
    request(geocodingAPIURL, function (error, response, body) {
      getLocalityFromCoordinates(error, response, body, function (error, municipio, provincia) { // Obtain locality associated to user coordinates
        if (municipio != undefined) { // The locality associated to that coordinates was found
          var municipioCode = municipiosData[provincia][municipio]; // Get the code for that locality
          var aemetAPIURL = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/' + municipioCode;
          const options = {
            method: 'GET',
            qs: {
              'api_key': APIKeys.aemet_api_key
            },
            url: aemetAPIURL,
            headers: {
              'Accept': 'application/json;charset=UTF-8', // Responde text/plain;charset=ISO-8859-15, Aemet debe corregirlo
              'Accept-Charset': 'UTF-8',
              'cache-control': 'no-cache'
            }
          };
          request(options, function (error, response, body) {
            getAemetDataURL(error, response, body, function (error, url) {
              const options = {
                method: 'GET',
                qs: {
                  'api_key': APIKeys.aemet_api_key
                },
                url: url,
                headers: {
                  'Accept': 'application/json;charset=UTF-8',
                  'Accept-Charset': 'UTF-8',
                  'cache-control': 'no-cache'
                }
              };
              request(options, function (error, response, body) {
                getAemetWeatherData(error, response, body, function (error, data) {
                  if (data != null) {
                    res.render('detailed', {
                      title: 'meteo',
                      location: municipio + ', ' + provincia,
                      data: data
                    });
                  } else {
                    console.log(error);
                    res.render('detailed', {
                      title: 'meteo',
                      error: 'No pudo obtenerse la información del tiempo'
                    });
                  }
                });
              });
            });
          });
        } else {
          console.log(error);
          res.render('detailed', {
            title: 'meteo',
            error: 'No pudo encontrarse su localización'
          });
        }
      })
    });
  } else if (query) { // The user has provided a query
    var placesAPIURL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=' + query + '&inputtype=textquery&fields=formatted_address,geometry/location&key=' + APIKeys.google_places_api_key;
    request(placesAPIURL, function (error, response, body) { // Convert place to coordinates
      getCoordinatesFromQuery(error, response, body, function (error, lat, lng) { // Obtain coordinates from response
        if (lat != undefined) { // The coordinates associated to that query was found
          var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + '&key=' + APIKeys.google_places_api_key;
          request(geocodingAPIURL, function (error, response, body) {
            getLocalityFromCoordinates(error, response, body, function (error, municipio, provincia) { // Obtain locality associated to that coordinates
              if (municipio != undefined) { // The locality associated to that coordinates was found
                var municipioCode = municipiosData[provincia][municipio]; // Get the code for that locality
                var aemetAPIURL = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/' + municipioCode;
                const options = {
                  method: 'GET',
                  qs: {
                    'api_key': APIKeys.aemet_api_key
                  },
                  url: aemetAPIURL,
                  headers: {
                    'Accept': 'application/json;charset=UTF-8', // Responde text/plain;charset=ISO-8859-15, Aemet debe corregirlo
                    'Accept-Charset': 'UTF-8',
                    'cache-control': 'no-cache'
                  }
                };
                request(options, function (error, response, body) {
                  getAemetDataURL(error, response, body, function (error, url) {
                    const options = {
                      method: 'GET',
                      qs: {
                        'api_key': APIKeys.aemet_api_key
                      },
                      url: url,
                      headers: {
                        'Accept': 'application/json;charset=UTF-8',
                        'Accept-Charset': 'UTF-8',
                        'cache-control': 'no-cache'
                      }
                    };
                    request(options, function (error, response, body) {
                      getAemetWeatherData(error, response, body, function (error, data) {
                        if (data != null) {
                          res.render('detailed', {
                            title: 'meteo',
                            location: municipio + ', ' + provincia,
                            data: data
                          });
                        } else {
                          console.log(error);
                          res.render('detailed', {
                            title: 'meteo',
                            error: 'No pudo obtenerse la información del tiempo'
                          });
                        }
                      });
                    });
                  });
                });
              } else {
                console.log(error);
                res.render('detailed', {
                  title: 'meteo',
                  error: 'No pudo encontrarse el lugar introducido'
                });
              }
            });
          });
        } else {
          console.log(error);
          res.render('detailed', {
            title: 'meteo',
            error: 'No pudo encontrarse ningún lugar llamado ' + query
          });
        }
      });
    });
  }
});

module.exports = router;
