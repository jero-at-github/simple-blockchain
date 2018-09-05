
module.exports = function(app, blockchain) {

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
            block = await blockchain.getBlock(blockHeight);
            res.send(block);
        }
        catch (ex) {
            res.status(400).send({error: ex});    
        }
    });

    // create a new block
    app.post('/block', async function (req, res) {    
        
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
        else if (!req.body.star.right_ascension) {
            res.status(400).send({error: "The star object doesn't contain a right ascension value"});    
            return;
        }
        else if (!req.body.star.declination) {
            res.status(400).send({error: "The star object doesn't contain a declination value"});    
            return;
        }                 
       
        address = req.body.address;
        star = req.body.star;

        if (star.story) {
            let encodedStory = Buffer(5).from(star.story, 'ascii').toString('hex');
            star.story = encodedStory;
        }

        // create block and add it to the blockchain
        let blockBody = new simpleChain.Block({
            address: address,
            star: star
        });   

        let createdBlock = await blockchain.addBlock(blockBody);           

        // return block 
        res.send(createdBlock);
    });
}