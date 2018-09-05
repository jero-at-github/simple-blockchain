const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

var Block = require('../classes/block.js');

let getRemainingTime = function(validationWindow, requestTimeStamp) {

    return validationWindow -= ((new Date().getTime() / 1000) - requestTimeStamp).toFixed(0);
}

module.exports = function(app, blockchain) {

    let requests = {};                  // Object to save the current status of users requests
    let timeToExpire = 60 * 5    // 300 seconds (5 minutes)
    
    /**
     * @desc Initiate a request action
     * @param string $address - wallet address
    */
    app.get('/request/:address', async function (req, res) {    
        
        try {              
            let address = req.params.address;    

            //check if the request already existed
            if (requests[address]) {
                // update validationWindow                        
                requests[address].validationWindow = getRemainingTime(requests[address].validationWindow, requests[address].requestTimeStamp);

                 // validate if the window time is still valid
                if (requests[address].validationWindow <= 0) {
                    
                    // request expired, remove it to force to generate a new one
                    delete requests[address];

                    res.status(400).send({error: "The time to validate the signature has expired. Please initiate a new request."});    
                    return;
                }        
            }           
            else {
                let currentTimeStamp = (new Date().getTime() / 1000);                
                let messageToValidate = address + ":" + currentTimeStamp + ":" + "starRegistry";           
                                
                // save in memory the state
                requests[address] = {
                    address: address,
                    requestTimeStamp: currentTimeStamp,
                    message: messageToValidate,                
                    validationWindow: timeToExpire
                };          
            }            
                        
            // return response
            res.json(requests[address]);
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

            // update validationWindow                        
            requests[address].validationWindow = getRemainingTime(requests[address].validationWindow, requests[address].requestTimeStamp);
            
            // validate if the window time is still valid
            if (requests[address].validationWindow <= 0) {
                
                // request expired, remove it to force to generate a new one
                delete requests[address];

                res.status(400).send({error: "The time to validate the signature has expired. Please initiate a new request."});    
                return;
            }        
            // validate the signature
            else if (!bitcoinMessage.verify(requests[address].message, address, signature)) {
                                               
                res.status(400).send({error: "The signature provided was not correct. Please review your generated signature."});    
                return;
            }
            // success
            else {                
                let response = {
                    registerStar: true,
                    status: {
                        address: address,
                        requestTimeStamp: requests[address].requestTimeStamp,
                        message: requests[address].message,
                        validationWindow: requests[address].validationWindow,
                        messageSignature: "valid"
                    }
                };

                // save in memory the state
                requests[address].messageSignature = "valid";

                res.send(response);
            }   
        }
        catch (ex) {
            res.status(500).send({error: ex});    
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
            else if (requests[address].messageSignature != "valid") {
                res.status(400).send({error: "The current request was not validated yet, please validate first providing the requested signature."});    
                return;
            }

            // encode story into hex format
            if (star.story) {
                let encodedStory = Buffer.from(star.story, 'ascii').toString('hex');
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
            res.send(block);
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

}

