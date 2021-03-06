let self = {};

const persistence = require("../persistence");
const Block = require("./block.js");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

self = class Blockchain {

    constructor() {               
    }

    //Initialises the chain data reading from the persistance layer
    //reset: Set to true to reset the persistance data
    async initChain(reset = false)  {

        return await new Promise( (resolve, rejection) => {                                

            if (reset) {     
                //reset level db                         
                persistence.resetLevelDB().then(this.ensureGenesisBlock.bind(this)).then( () => { 
                    resolve(true);
                });
            }
            else {                             
                this.ensureGenesisBlock().then( () => { 
                    resolve(true);
                });
            }        
        });        
    }

    async ensureGenesisBlock() {

         return new Promise( (resolve, rejection) => {      
            
            this.getBlockHeight().then( length => {
                
                length ++; //next availabe height
                if (length == 0) {
                    
                    console.log("Adding genesis block");
                    this.addBlock(new Block("Genesis block, be the first to register a star in the blockchain!")).then( ()=> {
                        resolve();
                    });                    
                }
                else {
                    resolve();
                }
            });                
        });     
    }

    async reset() {

        return new Promise( (resolve, reject) => {
             //reset level db                         
             persistence.resetLevelDB().then(this.ensureGenesisBlock.bind(this)).then( () => { resolve() } );
        });             
    }

    //Output the content of the chain in the console
    async printChainData() {
                
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
    async addBlock(newBlock = null) {

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
                            resolve(newBlock);
                        });               
                    });                                         
            });                            
        });            
    }

    // Get the last block height in the chain
    async getBlockHeight() {

        return persistence.getLevelDBDataLength();        
    }   

    // Get a specific block from level DB
    async getBlock(blockHeight) {        
        
        return persistence.getLevelDBDataValue(blockHeight);        
    }

    // Get a specific block from level DB
    async getBlockByHash(hash) {        
        
        return persistence.getLevelDBDataValueByAttribute("hash", hash);        
    }

    // Get a specific block from level DB
    async getBlockByWalletAddress(address) {        
        
        return persistence.getLevelDBDataValueByAttribute("body.address", address);        
    }

    //Validate a block stored within levelDB
    async validateBlock(blockHeight = null) {

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
    async validateChain() {

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

    async corruptBlock(height) {

        return new Promise((resolve, reject) => {

            this.getBlock(height).then( (block) => {

                console.log("Corrupting block #" + height);
                block.body = "Message corrupted";

                persistence.addLevelDBData(height, block).then( () => { resolve(); });
            });
        });
    }    
}

module.exports = self;