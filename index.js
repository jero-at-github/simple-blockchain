var express = require('express');
var simpleChain = require('./simpleChain');

var app = express();

// respond with the requested block
app.get('/block/:blockHeight', function (req, res) {
  res.send('hello world');
});

app.listen(8000, () => {

    let myPrivateBC = new simpleChain.Blockchain();   
    myPrivateBC.initChain(true);
    console.log('Listening on port 8000!');
} );
