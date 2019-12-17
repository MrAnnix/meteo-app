var request = require('request');

var utils = require('./utils');

var APIKeys = require('../data/APIKeys.json');
var municipiosData = require('../data/newMunicipios.json');


/**
 * Handle multiple requests at once
 * @param urls [array]
 * @param callback [function]
 * @requires request module for node ( https://github.com/mikeal/request )
 * Thanks to natos --> https://gist.github.com/natos/2001487
 */
var __request = function (urls, callback) {

  'use strict';

  var results = {},
  t = urls.length,
  c = 0,
  handler = function (error, response, body) {

    var url = response.request.uri.href;

    results[url] = {
      error: error,
      response: response,
      body: body
    };

    if (++c === urls.length) {
      callback(results);
    }

  };
  while (t--) {
    request(urls[t], handler);
  }
};


/* Get coordinates from query. */
function getCoordinatesFromQuery(query) {
  var placesAPIURL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=' + query + '&inputtype=textquery&fields=formatted_address,geometry/location&key=' + APIKeys.google_places_api_key;
  const options = {
    method: 'GET',
    url: placesAPIURL,
    headers: {
      'Accept': 'application/json;charset=UTF-8',
      'Accept-Charset': 'UTF-8',
      'cache-control': 'no-cache'
    }
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      var lat,lng;
      try {
        var place = JSON.parse(body)
        lat = place.candidates[0].geometry.location.lat;
        lng = place.candidates[0].geometry.location.lng;
        resolve({latitude: lat, longitude: lng});
      } catch (e) {
        reject(e);
      }
    });
  });
};


/* Get city name and provincia from coordinates */
function getLocalityFromCoordinates(latitude, longitude) {
  var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&key=' + APIKeys.google_places_api_key;
  const options = {
    method: 'GET',
    url: geocodingAPIURL,
    headers: {
      'Accept': 'application/json;charset=UTF-8',
      'Accept-Charset': 'UTF-8',
      'cache-control': 'no-cache'
    }
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      var municipio, provincia;
      try {
        var place = JSON.parse(body);
        var placeDetails = place.results[0].address_components;
        var placeDetails = place.results.find(function (a) {
          var muni = a.address_components.find(e => e.types[0] === "locality");
          var prov = a.address_components.find(e => e.types[0] === "administrative_area_level_2");
          if (muni && prov) {
            municipio = muni.long_name;
            provincia = prov.long_name;
            return 1;
          }
        });
        resolve({municipio: municipio, provincia: provincia});
      } catch (e) {
        reject(e);
      }
    });
  });
};


/* Get aemet json for data */
function getAemetDiaryData(municipio, provincia) {
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
  var aemetDataURL = new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      try {
        var data = JSON.parse(body);
        resolve(data.datos);
      } catch (e) {
        reject(e);
      }
    });
  });
  
  return new Promise(function (resolve, reject) {
    aemetDataURL.then(function(url){
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
        try {
          if (response.statusCode != 200)
            throw 'Aemet data not found or was expired';
          resolve(JSON.parse(body));         
        } catch (e) {
          reject(e);
        }
      });
    }).catch(function(error){
      reject(error);
    });
  });
};


module.exports = { getCoordinatesFromQuery, getLocalityFromCoordinates, getAemetDiaryData };