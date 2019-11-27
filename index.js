const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('meteo')
})

app.listen(80, function () {
  console.log('Empezamos!')
})