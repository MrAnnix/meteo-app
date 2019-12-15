var request = require('request');
var express = require('express');
var router = express.Router();

var APIKeys = require('../data/APIKeys.json');


/* Get coordinates from query. */
function getCoordinatesFromQuery(error, response, body, callback){
  var place = JSON.parse(body)
  var lat, lng;
  if (error == null && place.candidates != undefined){
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
function getLocalityFromCoordinates(error, response, body, callback){
  var place = JSON.parse(body);
  if (error == null && place.results != undefined){
    var placeDetails = place.results[0].address_components;
    
    var municipio = placeDetails.find(e => e.types[0] === "locality");
    municipio = municipio.long_name;
    
    var provincia = placeDetails.find(e => e.types[0] === "administrative_area_level_2");
    provincia = provincia.long_name;
    
    callback(error, municipio, provincia);
  } else {
    callback(error, null, null);
  }
};


/* GET detailed block. */
router.get('/', function(req, res, next) {
  let query = req.query.location;
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;
  
  if (query == undefined) {
    var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&key='+APIKeys.google_places_api_key;
    request(geocodingAPIURL, function (error, response, body) {
      getLocalityFromCoordinates(error, response, body, function (error, municipio, provincia) {
        if (municipio != undefined) {
          res.render('detailed', { title: 'meteo', location: municipio + ', ' + provincia});
        } else {
          console.log(error);
          res.render('detailed', { title: 'meteo', error: 'No pudo encontrarse su localización'});
        }
      })
    });
  } else {
    var placesAPIURL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input='+query+'&inputtype=textquery&fields=formatted_address,geometry/location&key='+APIKeys.google_places_api_key;
    request(placesAPIURL, function (error, response, body) {
      getCoordinatesFromQuery(error, response, body, function (error, lat, lng) {
        if (lat != undefined) {
          var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key='+APIKeys.google_places_api_key;
          request(geocodingAPIURL, function (error, response, body) { 
            getLocalityFromCoordinates(error, response, body, function (error, municipio, provincia) {
              if (municipio != undefined) {
                res.render('detailed', { title: 'meteo', location: municipio + ', ' + provincia});
              } else {
                console.log(error);
                res.render('detailed', { title: 'meteo', error: 'No pudo encontrarse ningún lugar llamado ' + query});
              }
            });
          });
        } else {
          console.log(error);
          res.render('detailed', { title: 'meteo', error: 'No pudo encontrarse ningún lugar llamado ' + query});
        }
      });  
    });
  }
});

module.exports = router;