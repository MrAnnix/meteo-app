const url = require('url');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'meteo' });
});

router.get(['/index','/index.html','/index.htm','/index.jsp','/index.asp','/index.php'], function(req, res, next) {
  res.redirect(301, url.format({ pathname:'/', query:req.query }));
});

module.exports = router;
