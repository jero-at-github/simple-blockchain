# Private blockchain Data

## Description
Dear reviewer, I decided to use Express as node.js module in order to build my REST API.
I installed additionally [body-parser](https://www.npmjs.com/package/body-parser) to be able to receive data in my POST endpoint.

## Endpoints
I implemented the 2 required endpoints:
1. GET /block/:blockHeight  
   It retreives a specific block (JSON data) from the blockchain determined by the blockHeight parameter.  
   Example: GET ```localhost:8000/block/2```  
   Returns the block #2 in this case  

2. POST /block  
   It created a new block. Optional you can send a JSON object with the "body" attribute to customize the body text of the block.  
   Example: POST ```localhost:8000/block```  
   Returns the recently created block  

PS: I modified my simpleChain class to be able to execute the functions in the classes inside using "await"
