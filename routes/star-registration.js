const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

var Block = require('../classes/block.js');

let requests = {};           // Object to save the current status of users requests
let timeToExpire = 60 * 5    // 300 seconds (5 minutes)

let getRemainingTime = function(requestTimeStamp) {

    let currentTimeStamp = parseFloat((new Date().getTime() / 1000).toFixed(0));
    let remainingTime = timeToExpire - (currentTimeStamp - parseFloat(requestTimeStamp));

    return remainingTime;     
}

module.exports = function(app, blockchain) {
       
    /**
     * @desc Initiate a request action
     * @param string $address - wallet address
    */
    app.post('/request/', async function (req, res) {    
        
        try {              
            let address = req.body.address;    

            // check if the request already existed
            if (requests[address]) {

                // check if the request was already validated 
                if (requests[address].registerStar) {
                    res.status(400).send({error: "A request for this wallet address was already sucessfully validated."});    
                    return;
                }
                // there is already a request but was not validated yet
                else {
                    // update validationWindow                        
                    requests[address].status.validationWindow = getRemainingTime(requests[address].status.requestTimeStamp);                        

                    // validate if the window time is still valid
                    if (requests[address].status.validationWindow <= 0) {
                    
                        // request expired, remove it to force to generate a new one
                        delete requests[address];

                        res.status(400).send({error: "The time to validate the signature has expired. Please initiate a new request."});    
                        return;
                    }
                    else {
                        // return response
                        res.json({
                            address:            requests[address].status.address,
                            requestTimeStamp:   requests[address].status.requestTimeStamp,
                            message:            requests[address].status.message,                
                            validationWindow:   requests[address].status.validationWindow
                        });
                    }                                        
                }                                    
            }           
            else {
                // create a new request for this wallet address
                let currentTimeStamp = (new Date().getTime() / 1000).toFixed(0);                
                let messageToValidate = address + ":" + currentTimeStamp + ":" + "starRegistry";           
                                               
                // save in memory the state
                requests[address] = {                   
                    registerStar: false,
                    status: {
                        address:            address,
                        requestTimeStamp:   currentTimeStamp,
                        message:            messageToValidate,
                        validationWindow:   timeToExpire,
                        messageSignature:   ""
                    }
                };       
                
                // return response
                res.json({
                    address:            address,
                    requestTimeStamp:   currentTimeStamp,
                    message:            messageToValidate,                
                    validationWindow:   timeToExpire
                });
            }                                           
        }
        catch (ex) {
            res.status(500).send({error: ex});    
        }
    });

    /**
     * @desc Validates a message with its corresponding signature for a given wallet address
     * @param string $address - wallet address     
     * @param string $signature - signature of the message to validate          
    */
    app.post('/message-signature/validate', async function (req, res) {    
        
        try {                            
            // validate mandatory parameters
            let address = null;
            let signature = null;           

            if (!req.body.address) {
                res.status(400).send({error: "The address value is missing"});    
                return;
            }            
            else if (!req.body.signature) {
                res.status(400).send({error: "The signature value is missing"});    
                return;
            }
            
            address = req.body.address;
            signature = req.body.signature;            

            // validate if there is a current request for this address
            if (!requests[address]) {
                res.status(400).send({error: "There is no current request for this address, please initiate a request first."});    
                return;
            }
            // check if the request was already validated 
            else if (requests[address].registerStar) {
                res.status(400).send({error: "A request for this wallet address was already sucessfully validated."});    
                return;
            }
                               
            // update validationWindow                        
            requests[address].status.validationWindow = getRemainingTime(requests[address].status.requestTimeStamp);            
                            
            // validate if the window time is still valid
            if (requests[address].status.validationWindow <= 0) {
                
                // request expired, remove it to force to generate a new one
                delete requests[address];

                res.status(400).send({error: "The time to validate the signature has expired. Please initiate a new request."});    
                return;
            }        
            // validate the signature
            else if (!bitcoinMessage.verify(requests[address].status.message, address, signature)) {
                
                requests[address].status.messageSignature = "invalid";

                res.status(400).send({error: "The signature provided was not correct. Please review your generated signature."});    
                return;
            }
            // success
            else {                            
                // save in memory the state
                requests[address].registerStar = true;
                requests[address].status.messageSignature = "valid";

                res.send(requests[address]);
            }   
        }
        catch (ex) {

            let error = "";

            if (ex.message) {
                error = ex.message;
            }
            else {
                error = ex;
            }

            res.status(500).send({error: error});    
        }                         
    });

    /**
     * @desc Create a new block and add it to the blockchain
     * @param string $address - wallet address     
     * @param string $star - star object         
    */
    app.post('/block', async function (req, res) {    
                
        try {             
            let address = null;
            let star = null;
            
            // validate mandatory parameters
            if (!req.body.address) {
                res.status(400).send({error: "The address value is missing"});    
                return;
            }            
            else if (!req.body.star) {
                res.status(400).send({error: "The star object value is missing"});    
                return;
            }
            else if (!req.body.star.dec) {
                res.status(400).send({error: "The star object doesn't contain a right ascension value"});    
                return;
            }
            else if (!req.body.star.ra) {
                res.status(400).send({error: "The star object doesn't contain a declination value"});    
                return;
            }                 
        
            address = req.body.address;
            star = req.body.star;

            // validate if there is a current request for this address and the message as validated
            if (!requests[address]) {
                res.status(400).send({error: "There is no current request for this address, please initiate a request first."});    
                return;
            }
            else if (requests[address].status.messageSignature != "valid") {
                res.status(400).send({error: "The current request was not validated yet, please validate first providing the requested signature."});    
                return;
            }

            // encode story into hex format
            if (star.story) {
                let encodedStory = Buffer.from(star.story, 'ascii', ).slice(0, 500).toString('hex');
                star.story = encodedStory;
            }

            // create block and add it to the blockchain
            let blockBody = new Block({
                address: address,
                star: star
            });   

            let createdBlock = await blockchain.addBlock(blockBody);           

            // return block 
            res.send(createdBlock);
        }
        catch (ex) {
            res.status(500).send({error: ex});    
        }               
    });
  
    /**
     * @desc Respond with the requested block
     * @param number $hash - hash of the requested block 
    */
    app.get('/stars/hash/:hash', async function (req, res) {    
        
        let blocks = null;
        let hash = req.params.hash;        
       
        try {            
            blocks = await blockchain.getBlockByHash(hash);

            if (blocks.length == 0) {
                res.status(400).send({error: "No block were found with this hash value"});    
                return;
            }
            else {
                // decode stroy value from hex to ascii
                blocks.forEach(block => {
                    if (block.body.star && block.body.star.story) {
                        block.body.star.story = new Buffer(block.body.star.story, 'hex').toString("ascii");
                    }
                });             

                res.send(blocks);
            }            
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

    /**
     * @desc Respond with the requested blocks
     * @param number $address - address of the requested blocks 
    */
    app.get('/stars/address/:address', async function (req, res) {    
        
        let blocks = null;
        let address = req.params.address;        
    
        try {            
            blocks = await blockchain.getBlockByWalletAddress(address);

            if (blocks.length == 0) {
                res.status(400).send({error: "No block were found with this wallet address value"});    
                return;
            }
            else {
                // decode stroy value from hex to ascii
                blocks.forEach(block => {
                    if (block.body.star && block.body.star.story) {
                        block.body.star.story = new Buffer(block.body.star.story, 'hex').toString("ascii");
                    }
                });

                res.send(blocks);
            }            
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

    /**
     * @desc Respond with the requested block
     * @param number $blockHeight - height of the requested block 
    */
    app.get('/block/:blockHeight', async function (req, res) {    
        
        let block = null;
        let blockHeight = req.params.blockHeight;

        if (isNaN(blockHeight)) {
            res.status(400).send({error: "The block height value has to be a number!"});    
            return;
        }

        blockHeight = parseFloat(blockHeight);

        try {
            block = await blockchain.getBlock(blockHeight);

            // decode stroy value from hex to ascii
            if (block.body.star && block.body.star.story) {
                block.body.star.story = new Buffer(block.body.star.story, 'hex').toString("ascii");
            }                

            res.send(block);
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });
    
}

