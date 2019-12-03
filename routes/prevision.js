var express = require('express');
var router = express.Router();

/* GET prevision block. */
router.get('/', function(req, res, next) {
  let location = req.query.location;
  let longitude = req.query.latitude;
  let latitude = req.query.longitude;
  
  res.render('prevision', { title: 'meteo', location, longitude, latitude });
});

module.exports = router;