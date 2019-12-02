var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let location = req.query.location;
  
  res.render('index', { title: 'meteo', location });
});

module.exports = router;
