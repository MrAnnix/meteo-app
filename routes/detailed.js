var request = require('request');
var express = require('express');
var router = express.Router();

var APIKeys = require('../data/APIKeys.json');
var municipiosData = require('../data/municipios.json');

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
    
    var placeDetails = place.results.find(function(a){
      var muni = a.address_components.find(e => e.types[0] === "locality");
      var prov = a.address_components.find(e => e.types[0] === "administrative_area_level_2");
      if(muni && prov){
        callback(error, muni.long_name, prov.long_name);
        return 'found';
      }
    });
  } else {
    callback(error, null, null);
  }
};


/* Get aemet json for data */
function getHtmlData(error, response, body, callback){
  if(error){
    throw error;
  } else {
    var data = JSON.parse(body)
  }
  callback(data);
};


/* Get aemet data */
function getAemetData(error, response, body, callback){
  if(error){
    throw error;
  } else {
    var previsionData = JSON.parse(body)
  }
  callback(previsionData);
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
			  var municipioCode = municipiosData[provincia][municipio];
              console.log(municipioCode);
			  var aemetURL = 'https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/'+municipioCode+'/?format=json&api_key='+ APIKeys.aemet_api_key;
			  console.log(aemetURL);
              request(aemetURL, function (error, response, body) {
                getHtmlData(error, response, body, function (data) {
			      var aemetInfo = data.datos;
				  console.log(aemetInfo);
				  request(aemetInfo, function (error, response, body){
				    getAemetData(error, response, body, function (previsionData){
					  console.log(previsionData);
					})
				  })
				})
			  })
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