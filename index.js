var express = require('express');
var app = express();
var bodyParser = require('body-parser')

var simpleChain = require('./simpleChain');
let myPrivateBC = null;

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

/* ENDPOINTS */
require("./star-registration.js")(app);

// respond with the requested block
app.get('/block/:blockHeight', async function (req, res) {    
    
    let block = null;
    let blockHeight = req.params.blockHeight;

    if (isNaN(blockHeight)) {
        res.status(400).send({error: "The block height value has to be a number!"});    
        return;
    }

    blockHeight = parseFloat(blockHeight);

    try {
        block = await myPrivateBC.getBlock(blockHeight);
        res.send(block);
    }
    catch (ex) {
        res.status(400).send({error: ex});    
    }
});

// create a new block
app.post('/block', async function (req, res) {    

    let createdBlock = null;
    let blockData = null;

    if (req.body.body) {

        let body = req.body.body;
        blockData = new simpleChain.Block(body);   
    }    

    createdBlock = await myPrivateBC.addBlock(blockData);   
    
    res.send(createdBlock);
});

/* INITIALIZATION OF HTTP SERVER */
app.listen(8000, () => {

    myPrivateBC = new simpleChain.Blockchain();    // let's instance the chainblock class

    (async function init() {
        
        await myPrivateBC.initChain(true);      // init the chain, (set the parameter to true if you want to reset the db)  
                                                // if the chain is empty then we create automatically the genesis block                                                       

        /*
        //let's add 5 new blocks                                                
        for (let i= 1; i <= 5; i++) {
            await myPrivateBC.addBlock(new simpleChain.Block("Block " + i + "!"));       
        }        
        
        await myPrivateBC.printChainData();     // let's print the whole chain
        */
    })();
} );
