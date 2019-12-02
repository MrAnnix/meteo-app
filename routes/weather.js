var express = require('express');
var router = express.Router();

/* GET weather block. */
router.get('/', function(req, res, next) {
  let location = req.query.location;
  let longitude = req.query.latitude;
  let latitude = req.query.longitude;
  
  res.render('weather', { title: 'meteo', location, longitude, latitude });
});

module.exports = router;