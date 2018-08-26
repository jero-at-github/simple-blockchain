# Private blockchain Data

Dear reviewer, I decided to use Express as node.js module in order to build my REST API.
I include the 2 required endpoints:

1) GET /block/:blockHeight
It retreives a specific block (JSON data) from the blockchain determined by the blockHeight parameter.
Example: localhost:8000/block/0
Returns the genesis block in this case


