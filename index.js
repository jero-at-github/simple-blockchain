var express = require('express');

var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.send('hello world')
});

app.listen(8000, () => console.log('Listening on port 8000!'))
