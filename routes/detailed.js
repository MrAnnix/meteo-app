var express = require('express');
var router = express.Router();

/* GET detailed block. */
router.get('/', function(req, res, next) {
  let location = req.query.location;
  let longitude = req.query.latitude;
  let latitude = req.query.longitude;
  
  res.render('detailed', { title: 'meteo', location, longitude, latitude });
});

module.exports = router;