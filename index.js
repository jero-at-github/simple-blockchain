var express = require('express');
var simpleChain = require('./simpleChain');

var app = express();

let myPrivateBC = null;

// respond with the requested block
app.get('/block/:blockHeight', async function (req, res) {

    let blockHeight = parseFloat(req.params.blockHeight);
    let block = await myPrivateBC.getBlock(blockHeight);
    res.send(block);
});

app.listen(8000, () => {

    myPrivateBC = new simpleChain.Blockchain();    // let's instance the class

    (async function init() {
        
        await myPrivateBC.initChain(true);      // init the chain, (set the parameter to true if you want to reset the db)  
                                                // if the chain is empty then we create automatically the genesis block                                                       

        //let's add 5 new blocks                                                
        await myPrivateBC.addBlock(null);       
        await myPrivateBC.addBlock(null);       
        await myPrivateBC.addBlock(null);       
        await myPrivateBC.addBlock(null);       
        await myPrivateBC.addBlock(null);       

        await myPrivateBC.printChainData();     // let's print the whole chain
    })();
} );
