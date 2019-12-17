var request = require('request');
var express = require('express');
var router = express.Router();


/* GET full weather block. */
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