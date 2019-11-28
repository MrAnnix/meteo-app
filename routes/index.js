var express = require('express');
var router = express.Router();
var geoip = require('geoip-lite');

/* GET home page. */
router.get('/', function(req, res, next) {
  let location = req.query.location
  let ip = req.connection.remoteAddress
  console.log(ip);
  let geo = geoip.lookup(ip)
  if (geo){
    var city = geo.city
  }
  res.render('index', { title: 'meteo', location, city });
});

module.exports = router;
