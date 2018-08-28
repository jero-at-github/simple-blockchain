# Private blockchain Data

## Description
Dear reviewer, I decided to use [Express](https://expressjs.com/) as node.js module in order to build my REST API.
I installed additionally [body-parser](https://www.npmjs.com/package/body-parser) to be able to receive data in my POST endpoint.

## Endpoints
I implemented the 2 required endpoints:
1. Get a block  
   It retreives a specific block (JSON data) from the blockchain determined by the blockHeight parameter.  
   GET URL path: ```localhost:8000/block/{blockHeight}```  
   Returns the requested block data

2. Create a block    
   It creates a new block. Optional you can send a JSON object with the "body" attribute to customize the body text of the block.  

   POST URL path: ```http://localhost:8000/block```  
   Content-Type: application/json  
   Request body: {"body":"block body contents"}  
   
   Returns the recently created JSON block data
