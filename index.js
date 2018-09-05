/* Node.js modules */
var bodyParser = require('body-parser')
var app = require('express')();

app.use( bodyParser.json() );                       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded({extended: true}) ); // to support URL-encoded bodies

/* Classes */
var Blockchain = require('./classes/blockchain.js');
var Block = require('./classes/block.js');
  
/* ENDPOINTS */
let myPrivateBC = new Blockchain();
require("./routes/star-registration")(app, myPrivateBC);
require("./routes/blockchain")(app);

/* INITIALIZATION OF HTTP SERVER */
app.listen(8000, () => {
   
    (async function init() {
        
        await myPrivateBC.initChain(true);      // init the chain, (set the parameter to true if you want to reset the db)  
                                                // if the chain is empty then we create automatically the genesis block                                                               
        
        //Example:
        /*                       
        await myPrivateBC.validateBlock(0);     // let's validate the genesis block  

        await myPrivateBC.addBlock(null);       // let's add a new block                                               
        await myPrivateBC.validateBlock();      // let's validate the last block in the chain

        await myPrivateBC.addBlock(new Block("Custom body value!"));   // let's add a new block setting its body value
        await myPrivateBC.validateBlock();                                  // let's validate the last block in the chain

        await myPrivateBC.validateChain();      // let's validate the whole chain
        await myPrivateBC.printChainData();     // let's print the whole chain

        await myPrivateBC.corruptBlock(0);      // let's corrupt the genesis block                  
        await myPrivateBC.printChainData();     // let's print the whole chain
        await myPrivateBC.validateChain();      // let's validate again the whole chain

        await myPrivateBC.reset();              // let's reset the chain
        await myPrivateBC.printChainData();     // let's print the whole chain again      
        */ 
    })();
} );
