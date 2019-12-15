var request = require('request');
var express = require('express');
var router = express.Router();

var APIKeys = require('../data/APIKeys.json');


/* Get coordinates from query. */
function getCoordinatesFromQuery(error, response, body, callback){
  if(error){
    throw error;
  } else {
    var place = JSON.parse(body)  
    console.log(place);
    if(place.candidates[0] == undefined) throw 'Coordinates could not be solved';
    var lat = place.candidates[0].geometry.location.lat;
    var lng = place.candidates[0].geometry.location.lng;
    callback(lat, lng);
  }
};


/* Get city name and provincia from coordinates */
function getLocalityFromCoordinates(error, response, body, callback){
  if(error){
    throw error;
  } else {
    var place = JSON.parse(body);
    var placeDetails = place.results[0].address_components;
        
    var municipio = placeDetails.find(e => e.types[0] === "locality");
    municipio = municipio.long_name;
        
    var provincia = placeDetails.find(e => e.types[0] === "administrative_area_level_2");
    provincia = provincia.long_name;
  }
  callback(municipio, provincia);
};


/* GET detailed block. */
router.get('/', function(req, res, next) {
  let query = req.query.location;
  let latitude = req.query.latitude;
  let longitude = req.query.longitude;
  
  try{
    if (query == undefined) {
      var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&key='+APIKeys.google_places_api_key;
      request(geocodingAPIURL, function (error, response, body) {
        getLocalityFromCoordinates(error, response, body, function (municipio, provincia) {
          if (municipio != undefined) res.render('detailed', { title: 'meteo', location: municipio + ', ' + provincia});
        })
      });
    } else {
      var placesAPIURL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input='+query+'&inputtype=textquery&fields=formatted_address,geometry/location&key='+APIKeys.google_places_api_key;
      console.log(query);
      request(placesAPIURL, function (error, response, body) {
        getCoordinatesFromQuery(error, response, body, function (lat, lng) {
          if (lat != undefined) {
            var geocodingAPIURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key='+APIKeys.google_places_api_key;
            request(geocodingAPIURL, function (error, response, body) { 
              getLocalityFromCoordinates(error, response, body, function (municipio, provincia) {
                if (municipio != undefined) res.render('detailed', { title: 'meteo', location: municipio + ', ' + provincia});
              });
            });
          }
        });  
      });
    }
  } catch (e) {
    console.log('Error: '+e);
    res.render('detailed', { title: 'meteo', error: 'An error has occurred'});
  }
});

module.exports = router;