const bitcoinLib = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

module.exports = function(app) {

    let requests = {};
    let windowValidation = 1000 * 60 * 5 // 300 seconds (5 minutes)

    // respond with the requested block
    app.get('/request/:address', async function (req, res) {    
        
        let currentTimeStamp = new Date().getTime();
        let address = req.params.address;     
        let messageToValidate = address + ":" + currentTimeStamp + ":" + "starRegistry";

        // save in memory the request
        requests[address] = { 
            timestamp: currentTimeStamp,
            message: messageToValidate 
        };

        try {            
            // return response
            let response = {
                address: address,
                requestTimeStamp: currentTimeStamp,
                message: messageToValidate,                
                validationWindow: windowValidation
            };          

            res.json(response);
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

    // validate a message
    app.post('/message-signature/validate', async function (req, res) {    

        let address = null;
        let signature = null;

        try {    

            // validate mandatory "address" parameter
            if (!req.body.address) {
                res.status(400).send({error: "The address value is missing"});    
                return;
            }
            // validate mandatory "signature" parameter
            else if (!req.body.signature) {
                res.status(400).send({error: "The signature value is missing"});    
                return;
            }
            
            address = req.body.address;
            signature = req.body.signature;

            // validate if there is a valid request for this address
            if (!requests[address]) {
                res.status(400).send({error: "There is no current request for this address, please initiate a request first."});    
                return;
            }
            // validate if the window time is till valid
            else if ( (requests[address].timestamp + windowValidation) < new Date().getTime()) {
                
                // remove request
                delete requests[address];

                res.status(400).send({error: "The time to validate the signature has expired. Please initiate a new request."});    
                return;
            }        
            else if (!bitcoinMessage.verify(requests[address].message, address, signature)) {
                res.status(400).send({error: "The signature provided was not correct. Please review your generated signature."});    
                return;
            }
            else {
                // sucess
                let response = {
                    registerStar: true,
                    status: {
                        address: address,
                        requestTimeStamp: requests[address].timestamp,
                        message: requests[address].message,
                        validationWindow: windowValidation,
                        messageSignature: "valid"
                    }
                };

                res.send(response);
            }   
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }                         
    });

}

