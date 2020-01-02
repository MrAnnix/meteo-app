var request = require('request');

var utils = require('./utils');

var APIKeys = require('../data/APIKeys.json');
var municipiosData = require('../data/newMunicipios.json');


/* Efficient repacement based on regexp */
String.prototype.replaceAll = function(str1, str2, ignore) 
{
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}


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


/* Array rotate */
Array.prototype.rotate = (function() {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    return function(count) {
        var len = this.length >>> 0,
            count = count >> 0;

        unshift.apply(this, splice.call(this, count % len, len));
        return this;
    };
})();


/* Create date object */
function createDate() {
  var fecha = new Date();
  return {
    date: fecha,
    year: fecha.getFullYear(),
    month: fecha.getMonth(),
    day: fecha.getDate(),
    hour: fecha.getHours(),
    minutes: fecha.getMinutes(),
    seconds: fecha.getSeconds(),
    weekday: fecha.getDay(),
    weekdayStr: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].rotate(fecha.getDay())
  };
};


/* Check locality in JSON */
function isInMunicipios(municipio, provincia) {
  var foo;
  try {
    foo = municipiosData[provincia][municipio];
  } catch (e) { }
  return foo;
};


/* Create Google Places API request options */
function createOptionsForFindPlaceFromText(url, query, coords) {
  if (coords)
    return {
      method: 'GET',
      uri: url,
      qs: {
        input: query,
        inputtype: 'textquery',
        fields: 'formatted_address,geometry/location',
        locationbias: 'point:'+coords.latitude+','+coords.longitude,
        key: APIKeys.google_places_api_key
      },
      headers: {
        'Accept': 'application/json;charset=UTF-8',
        'Accept-Charset': 'UTF-8',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    };
  return {
    method: 'GET',
    uri: url,
    qs: {
      input: query,
      inputtype: 'textquery',
      fields: 'formatted_address,geometry/location',
      key: APIKeys.google_places_api_key
    },
    headers: {
      'Accept': 'application/json;charset=UTF-8',
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'es-ES,es;q=0.9'
    }
  };
};


function createOptionsForGeocode(url, lat, lng) {
  return {
    method: 'GET',
    uri: url,
    qs: {
      latlng: lat+','+lng,
      key: APIKeys.google_places_api_key
    },
    headers: {
      'Accept': 'application/json;charset=UTF-8',
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'es-ES,es;q=0.9'
    }
  };
};


function createOptionsForIPGeolocation(url, ip) {
  return {
    method: 'GET',
    uri: url,
    qs: {
      ip: ip,
      apiKey: APIKeys.ipgeolocation_api_key
    },
    headers: {
      'Accept': 'application/json;charset=UTF-8',
      'Accept-Charset': 'UTF-8',
      'Accept-Language': 'es-ES,es;q=0.9'
    }
  };
};


/* Get coordinates from client IP address */
function getCoordinatesFromIP(ip) {
  var ipgeolocationAPIURL = 'https://api.ipgeolocation.io/ipgeo?apiKey=API_KEY&ip=1.1.1.1'
  const options = createOptionsForIPGeolocation(ipgeolocationAPIURL, ip);
  
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      var lat,lng;
      try {
        var place = JSON.parse(body);
        lat = place.latitude;
        lng = place.longitude;
        return resolve({latitude: lat, longitude: lng});
      } catch (e) {
        return reject(e);
      }
    });
  });
};


/* Get coordinates from query. */
function _getCoordinatesFromQuery(query, clientCoords) { 
  var placesAPIURL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
  const options = createOptionsForFindPlaceFromText(placesAPIURL, query, clientCoords);
  
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      var lat,lng;
      try {
        var place = JSON.parse(body);
        lat = place.candidates[0].geometry.location.lat;
        lng = place.candidates[0].geometry.location.lng;
        return resolve({latitude: lat, longitude: lng});
      } catch (e) {
        return reject(e);
      }
    });
  });
};


function getCoordinatesFromQuery(query, clientIP) {
  var userLocation = getCoordinatesFromIP(clientIP);  
  return userLocation.then(coordinates => {
    console.log(userLocation);
    return _getCoordinatesFromQuery(query, userLocation);
  }).catch(function () {
    return _getCoordinatesFromQuery(query);
  });
};


/* Get city name and provincia from coordinates */
function getLocalityFromCoordinates(latitude, longitude) {
  var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json';
  const options = createOptionsForGeocode(geocodingAPIURL, latitude, longitude);
  
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      var municipio, provincia;
      try {
        var place = JSON.parse(body);
        var placeDetails = place.results.find(function (a) {
          var muni = a.address_components.find(e => e.types[0] === "administrative_area_level_4");
          if (!muni) {
            muni = a.address_components.find(e => e.types[0] === "locality");
          }
          var prov = a.address_components.find(e => e.types[0] === "administrative_area_level_2");
          if (muni && prov) {
            municipio = muni.long_name;
            provincia = prov.long_name;
            return isInMunicipios(municipio, provincia);
          }
        });
        return resolve({municipio: municipio, provincia: provincia});
      } catch (e) {
        return reject(e);
      }
    });
  });
};


/* Create Aemet request options */
function createAemetOptionsForRequest(url) {
  return {
    method: 'GET',
    qs: {
      'api_key': APIKeys.aemet_api_key
    },
    url: url,
    headers: {
      'Accept': 'application/json;charset=UTF-8', // Responde text/plain;charset=ISO-8859-15, Aemet debe corregirlo
      'Accept-Charset': 'UTF-8',
      'cache-control': 'no-cache'
    }
  };
};


/* Get aemet json for data */
function getAemetDiaryData(municipio, provincia) {
  var municipioCode = municipiosData[provincia][municipio]; // Get the code for that locality
  var aemetURLMunicipioDiaria = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/' + municipioCode;
  const options = createAemetOptionsForRequest(aemetURLMunicipioDiaria);
  
  var aemetDataURL = new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      try {
        var data = JSON.parse(body);
        return resolve(data.datos);
      } catch (e) {
        return reject(e);
      }
    });
  });
  
  return new Promise(function (resolve, reject) {
    aemetDataURL.then(function(url){
      const options = createAemetOptionsForRequest(url);
      request(options, function (error, response, body) {
        try {
          if (response.statusCode != 200)
            throw 'Aemet data not found or was expired';
          return resolve(JSON.parse(body));         
        } catch (e) {
          return reject(e);
        }
      });
    }).catch(function(error){
      reject(error);
    });
  });
};


function getAemetHourlyData(municipio, provincia) {
  var municipioCode = municipiosData[provincia][municipio]; // Get the code for that locality
  var aemetURLMunicipioHoraria = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/' + municipioCode;
  const options = createAemetOptionsForRequest(aemetURLMunicipioHoraria);
  
  var aemetDataURL = new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (error)
        return reject(error);
      try {
        var data = JSON.parse(body);
        return resolve(data.datos);
      } catch (e) {
        return reject(e);
      }
    });
  });
  
  return new Promise(function (resolve, reject) {
    aemetDataURL.then(function(url){
      const options = createAemetOptionsForRequest(url);
      
      request(options, function (error, response, body) {
        try {
          if (response.statusCode != 200)
            throw 'Aemet data not found or was expired';
          return resolve(JSON.parse(body));         
        } catch (e) {
          return reject(e);
        }
      });
    }).catch(function(error){
      return reject(error);
    });
  });
};


module.exports = { getCoordinatesFromQuery, getLocalityFromCoordinates, getAemetDiaryData, getAemetHourlyData, createDate, String };