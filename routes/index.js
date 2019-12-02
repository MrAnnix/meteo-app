var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let input_location = req.query.location;
  let real_location = req.query.coord;
  
  console.log(real_location)
  
  res.render('index', { title: 'meteo', input_location, real_location });
});

module.exports = router;
