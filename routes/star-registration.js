const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

module.exports = function(app) {

    let requests = {};                  // Object to save the current status of users requests
    let timeToExpire = 1000 * 60 * 5    // 300000 milliseconds (5 minutes)
    
    /**
     * @desc Initiate a request action
     * @param string $address - wallet address
    */
    app.get('/request/:address', async function (req, res) {    
        
        try {              
            let currentTimeStamp = new Date().getTime();
            let address = req.params.address;     
            let messageToValidate = address + ":" + currentTimeStamp + ":" + "starRegistry";           
                              
            // save in memory the state
            requests[address] = {
                address: address,
                requestTimeStamp: currentTimeStamp,
                message: messageToValidate,                
                validationWindow: timeToExpire
            };          
                        
            // return response
            res.json(requests[address]);
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

    /**
     * @desc Validates a message with its corresponding signature for a given wallet address
     * @param string $address - wallet address     
     * @param string $signature - signature of the message to validate          
    */
    app.post('/message-signature/validate', async function (req, res) {    
        
        try {                
            // validate if there is a valid request for this address
            if (!requests[address]) {
                res.status(400).send({error: "There is no current request for this address, please initiate a request first."});    
                return;
            }

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

            // update validationWindow            
            requests[address].validationWindow -= new Date().getTime();
            
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
            res.status(400).send({error: ex});    
        }                         
    });

}

