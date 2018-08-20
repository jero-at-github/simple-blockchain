
const persistence = require("./persistence");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
    constructor(data) {
        this.hash = "",
            this.height = 0,
            this.body = data,
            this.time = 0,
            this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {

    constructor() {               
    }

    //Initialises the chain data reading from the persistance layer
    //reset: Set to true to reset the persistance data
    initChain(reset = false)  {

        return new Promise( (resolve, rejection) => {                                

            if (reset) {     
                //reset level db                         
                persistence.resetLevelDB().then(this.ensureGenesisBlock.bind(this)).then( () => { resolve() } );
            }
            else {                             
                this.ensureGenesisBlock().then( () => { resolve() } );
            }        
        });        
    }

    ensureGenesisBlock() {

         return new Promise( (resolve, rejection) => {      
            
            this.getBlockHeight().then( length => {
                
                length ++; //next availabe height
                if (length == 0) {
                    
                    console.log("Adding genesis block");
                    this.addBlock(new Block("First block in the chain - Genesis block")).then( ()=> {
                        resolve();
                    });                    
                }
                else {
                    resolve();
                }
            });                
        });     
    }

    reset() {

        return new Promise( (resolve, reject) => {
             //reset level db                         
             persistence.resetLevelDB().then(this.ensureGenesisBlock.bind(this)).then( () => { resolve() } );
        });             
    }

    //Output the content of the chain in the console
    printChainData() {
                
        return new Promise((resolve, reject) => {

            persistence.getAllLevelDBData()
            .then(data => {   

                if (data.length == 0) {
                    console.log("The blockchain is empty");
                    resolve();
                }
                else {
                    console.log("Printing chainblock data:");
                    console.dir(data);
                    resolve();
                }                                      
            })
            .catch(error => {
                reject(error);
            }); 
        });         
    }      

    // Add new block
    addBlock(newBlock = null) {

        return new Promise((resolve, reject) => {
           
            // if no block object is defined we use a default one
            if (newBlock == null) {
                newBlock = new Block("Sample data");
            }

            // get current used height in the chain
            this.getBlockHeight().then( length => {

                length ++; //next availabe height

                // Block height
                newBlock.height = length;
            
                // UTC timestamp
                newBlock.time = new Date().getTime().toString().slice(0, -3);
                
                // get previous block 
                this.getBlock(newBlock.height - 1)
                    .then( block => {
                        // set the previous hash in our new block
                        newBlock.previousBlockHash = block.hash;
                    })
                    .catch( () => {
                        // genesis case
                        newBlock.previousBlockHash = "";
                    })                    
                    .then( () => {                        
                        // Block hash with SHA256 using newBlock and converting to a string
                        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

                        // Adding block object to chain
                        persistence.addDataToLevelDB(newBlock).then( () => {                
                            resolve();
                        });               
                    });                                         
            });                            
        });            
    }

    // Get the last block height in the chain
    getBlockHeight() {

        return persistence.getLevelDBDataLength();
    }

    // Get a specific block from level DB
    getBlock(blockHeight) {        

        return persistence.getLevelDBDataValue(blockHeight);        
    }

    //Validate a block stored within levelDB
    validateBlock(blockHeight = null) {

        return new Promise((resolve, reject) => {
                       
            let validate = function () {

                // get the corresponding block object from levelDB                    
                let block = this.getBlock(blockHeight).then( block => {
                         
                        // get block hash
                        let blockHash = block.hash;
                
                        // remove block hash to test block integrity
                        block.hash = '';
                
                        // generate block hash
                        let validBlockHash = SHA256(JSON.stringify(block)).toString();
                        
                        // valid message
                        let validMessage = "";
                        if (blockHeight == 0) {
                            validMessage = "Genesis block is valid!";
                        }
                        else {
                            validMessage = "Block #" + blockHeight + " is valid!";
                        } 

                        // invalid message
                        let invalidMessage = 'Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash;

                        // Compare generated hash with original in block
                        if (blockHash === validBlockHash) {                   
                                          
                            // Check hash integrity with next block
                            persistence.getLevelDBDataValue(blockHeight + 1)
                                .then( (nextBlock) => {

                                    let previousHash = nextBlock.previousBlockHash;
                                    if (blockHash !== previousHash) {

                                        console.log(invalidMessage);
                                        resolve( {status: false, message: invalidMessage} )
                                    }
                                    else {
                                        console.log(validMessage);
                                        resolve( {status: true, message: validMessage} );  
                                    }
                                })                                
                                .catch( () => { //there is no next block since this is the last one
                                    console.log(validMessage);
                                    resolve( {status: true, message: validMessage} );  
                                });                                                                                                                                                        
                        } 
                        else {                            
                            console.log(invalidMessage);
                            resolve( {status: false, message: invalidMessage} );    
                        }        
                });                                             
            }.bind(this)            
            
            if (blockHeight == null) {

                // if no height was defined we use the last one
                this.getBlockHeight().then( (lastBlockHeight) => {                    
                    blockHeight = lastBlockHeight;
                    validate();
                });
            }
            else {                
                validate();                    
            }
        });                        
    }

    // Validate the whole blockchain stored within levelDB
    validateChain() {

        return new Promise((resolve, reject) => {

            console.log("Validating complete chain...");

            // get current used height in the chain
            this.getBlockHeight().then( lastHeight => {

                let promisesArray = [];

                for (var i = 0; i <= lastHeight; i++) {
                    
                    promisesArray.push(this.validateBlock(i));                   
                }
    
                Promise.all(promisesArray).then(function(values) {                    

                    let numBlocksWithError = 0;
                    let erroMessage = "";

                    values.forEach( (element, index) => {                       

                        if (!element.status) {
                            numBlocksWithError ++;
                            erroMessage += (numBlocksWithError > 1 ? "\r\n" : "") + element.message;
                        }                         
                    });

                    if (numBlocksWithError > 0) {
                        console.log('Block errors = ' + numBlocksWithError);
                        console.log('Blocks: ' + erroMessage);
                    }
                    else {
                        console.log('No errors detected in the chain');
                    }

                    resolve();
                });                
            });            
        });               
    }

    corruptBlock(height) {

        return new Promise((resolve, reject) => {

            this.getBlock(height).then( (block) => {

                console.log("Corrupting block #" + height);
                block.body = "Message corrupted";

                persistence.addLevelDBData(height, block).then( () => { resolve(); });
            });
        });
    }    
}

//Example:
let myPrivateBC2 = new Blockchain();                         // let's instance the class
myPrivateBC2.initChain(true)                                 // init the chain, (set the parameter to true if you want to reset the db)  
                                                            // if it is empty then we create automatically the genesis block    

    .then( () => { return myPrivateBC2.validateBlock(0) })   // let's validate the genesis block    

    .then(() => { return myPrivateBC2.addBlock(null) })      // let's add a new block
    .then(myPrivateBC2.validateBlock.bind(myPrivateBC2))      // let's validate the last block in the chain

    .then( () => { return myPrivateBC2.addBlock(new Block("Custom body value!")) } )     // let's add a new block setting its body value
    .then(myPrivateBC2.validateBlock.bind(myPrivateBC2))                                  // let's validate the last block in the chain

    .then(myPrivateBC2.validateChain.bind(myPrivateBC2))      // let's validate the whole chain
    .then(myPrivateBC2.printChainData)                       // let's print the whole chain

    .then(() => { return myPrivateBC2.corruptBlock(0) })     // let's corrupt the genesis block                  
    .then(myPrivateBC2.printChainData)                       // let's print the whole chain
    .then(myPrivateBC2.validateChain.bind(myPrivateBC2))      // let's validate again the whole chain

    .then(myPrivateBC2.reset.bind(myPrivateBC2))  // let's reset the chain
    .then(myPrivateBC2.printChainData)           // let's print the whole chain again
