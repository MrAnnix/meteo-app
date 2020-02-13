var request = require('request');
var express = require('express');
var router = express.Router();

var utils = require('./utils');


/* GET full weather block. */
router.get('/', function (req, res, next) {
  let query = utils.coalesce(req.query.location);
  let latitude = utils.coalesce(req.query.latitude);
  let longitude = utils.coalesce(req.query.longitude); 
  
  let clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  if (query == undefined && latitude && longitude) { // The user has not provided a query, but we got the coordinates
    utils.getLocalityFromCoordinates(latitude, longitude).then(locality => { // Obtain locality associated to that coordinates
      var diaryData  = utils.getAemetDiaryData(locality.municipio, locality.provincia); // Obtain Aemet diary data for query as a Promise
      var hourlyData = utils.getAemetHourlyData(locality.municipio, locality.provincia); // Obtain Aemet horly data for query as a Promise     
      Promise.all([hourlyData, diaryData]).then(datos => { // Render the resource
        res.render('weather', {
          title: 'meteo',
          location: locality.municipio + ', ' + locality.provincia,
          date: utils.createDate(),
          hourlyData: datos[0],
          diaryData: datos[1]
        });
      }).catch(error => {
        console.log(error);
        //res.status(404);
        res.render('weather', {
          title: 'meteo',
          error: 'No pudo obtenerse la información del tiempo asociada a "' + query.replaceAll('+', ' ') + '" revise su consulta'
        });
      });
    }).catch(error => {
      console.log(error);
      res.status(404);
      res.render('weather', {
        title: 'meteo',
        error: 'No pudimos encontrar ninguna localidad asociada a su ubicación'
      });
    });
  } else if (query) { // The user has provided a query
    utils.getCoordinatesFromQuery(query, clientIP).then(coordinates => { // Convert place to coordinates
      utils.getLocalityFromCoordinates(coordinates.latitude, coordinates.longitude).then(locality => { // Obtain locality associated to that coordinates
        var diaryData  = utils.getAemetDiaryData(locality.municipio, locality.provincia); // Obtain Aemet diary data for query as a Promise
        var hourlyData = utils.getAemetHourlyData(locality.municipio, locality.provincia); // Obtain Aemet horly data for query as a Promise       
        Promise.all([hourlyData, diaryData]).then(datos => { // Render the resource
          res.render('weather', {
            title: 'meteo',
            location: locality.municipio + ', ' + locality.provincia,
            date: utils.createDate(),
            hourlyData: datos[0],
            diaryData: datos[1]
          });
        }).catch(error => {
          console.log(error);
          res.status(404);
          res.render('weather', {
            title: 'meteo',
            error: 'No pudo obtenerse la información del tiempo asociada a "' + query.replaceAll('+', ' ') + '" revise su consulta'
          });
        });
      }).catch(error => {
        console.log(error);
        res.status(404);
        res.render('weather', {
          title: 'meteo',
          error: 'No pudimos encontrar el lugar "' + query.replaceAll('+', ' ') + '" revise su consulta'
        });
      });
    }).catch(error => {
      console.log(error);
      res.status(404);
      res.render('weather', {
        title: 'meteo',
        error: 'No pudimos encontrar el lugar "' + query.replaceAll('+', ' ') + '"'
      });
    });
  } else {
    res.status(404);
    res.render('weather', {
      title: 'meteo',
      error: 'Lo sentimos, no pudimos obtener su ubicación o su navegador no es compatible'
    });
  }
});

module.exports = router;
