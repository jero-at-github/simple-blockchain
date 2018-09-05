
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

        let createdBlock = null;
        let blockData = null;

        if (req.body.body) {

            let body = req.body.body;
            blockData = new simpleChain.Block(body);   
        }    

        createdBlock = await blockchain.addBlock(blockData);   
        
        res.send(createdBlock);
    });
}