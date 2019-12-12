var request = require('request');
var express = require('express');
var router = express.Router();

var APIKeys = require('../data/APIKeys.json');

/* GET detailed block. */
router.get('/', function(req, res, next) {
  let location = req.query.location;
  let longitude = req.query.latitude;
  let latitude = req.query.longitude;
  
  let url = 'http://api.geonames.org/geoCodeAddressJSON?q='+location+'&country=ES&maxRows=1&username='+APIKeys.geonames_api_key;
  console.log(url);
  request(url, function (err, response, body) {
    if(err){
      res.render('detailed', { title: 'meteo', error: 'An error has occurred'});
    } else {
      let place = JSON.parse(body)     
      try {
        res.render('detailed', { title: 'meteo', location: place.address.adminName3, longitude, latitude });
      }
      catch (e) {
        console.log(e);
        res.render('detailed', { title: 'meteo', error: 'An error has occurred'});
      }
    }
  });
});

module.exports = router;