var request = require('request');
var express = require('express');
var router = express.Router();

var utils = require('./utils');

var APIKeys = require('../data/APIKeys.json');
var municipiosData = require('../data/newMunicipios.json');

/* Get coordinates from query. */
function getCoordinatesFromQuery(error, response, body, callback) {
  var place = JSON.parse(body)
  var lat, lng;
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
    utils.getLocalityFromCoordinates(latitude, longitude).then(function (locality) { // Obtain locality associated to that coordinates
      utils.getAemetDiaryData(locality.municipio, locality.provincia).then(function(datos){ // Obtain Aemet diary data for user location
        res.render('detailed', {
          title: 'meteo',
          location: locality.municipio + ', ' + locality.provincia,
          data: datos
        });
      }).catch(function(error){
        console.log(error);
        res.render('detailed', {
          title: 'meteo',
          error: 'No pudo obtenerse la información del tiempo asociada a su ubicación'
        });
      });
    }).catch(function(error) {
      console.log(error);
      res.render('detailed', {
        title: 'meteo',
        error: 'No pudimos encontrar ninguna localidad asociada a su ubicación'
      });
    });
  } else if (query) { // The user has provided a query
    utils.getCoordinatesFromQuery(query).then(function(coordinates){ // Convert place to coordinates
      utils.getLocalityFromCoordinates(coordinates.latitude, coordinates.longitude).then(function(locality){ // Obtain locality associated to that coordinates
        utils.getAemetDiaryData(locality.municipio, locality.provincia).then(function (datos) { // Obtain Aemet diary data for query
          res.render('detailed', {
            title: 'meteo',
            location: locality.municipio + ', ' + locality.provincia,
            data: datos
          });
        }).catch(function (error) {
          console.log(error);
          res.render('detailed', {
            title: 'meteo',
            error: 'No pudo obtenerse la información del tiempo asociada a "' + query + '" revise su consulta'
          });
        });
      }).catch(function(error){
        console.log(error);
        res.render('detailed', {
          title: 'meteo',
          error: 'No pudimos encontrar el lugar "' + query + '" revise su consulta'
        });
      });
    }).catch(function(error){
      console.log(error);
      console.log(error);
      res.render('detailed', {
        title: 'meteo',
        error: 'No pudimos encontrar el lugar "' + query + '"'
      });
    });
  } else {
    res.render('detailed', {
      title: 'meteo',
      error: 'Lo sentimos, no pudimos obtener su ubicación o su navegador no es compatible'
    });
  }
});

module.exports = router;
