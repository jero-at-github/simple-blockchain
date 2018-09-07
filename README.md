# Private blockchain Data

## Description
I decided to use [Express](https://expressjs.com/) as node.js module in order to build my REST API.
I installed additionally [body-parser](https://www.npmjs.com/package/body-parser) to be able to receive data in my POST endpoints.

## Endpoints
1.  Request    
    [POST] URL path: ```localhost:8000/requestValidation/```  
    * @desc Initiate a request action
    * @param string $address - wallet address
    Returns the remaing time to validate, request timestamp and the message to validate

2.  Validate    
    [POST] URL path: ```/message-signature/validate```  
    * @desc Validates a message with its corresponding signature for a given wallet address
    * @param string $address - wallet address     
    * @param string $signature - signature of the message to validate      
    If success, returns an object indicating that the registration of the star can begin

3. Get a block     
   [GET] URL path: ```localhost:8000/block/:blockHeight```  
   * @desc Respond with the requested block
   * @param number $blockHeight - height of the requested block       
   Returns the requested block data for the specific height

4. Create a block       
   [POST] URL path: ```http://localhost:8000/block```  
   * @desc Create a new block and add it to the blockchain
   * @param string $address - wallet address     
   * @param string $star - star object       
   Returns the recently created block data

5. Search a star by hash  
    [GET] URL path: ```localhost:8000/star/:[HASH]}```  
   * @desc Respond with the requested block
   * @param number $hash - hash of the requested block
   Returns the block which hash was searched

5. Search stars by wallet address  
    [GET] URL path: ```localhost:8000/address/:[ADDRESS]}```  
   * @desc Respond with the requested blocks
   * @param number $address - address of the requested blocks 
   Returns the stars associated to a specific wallet address
