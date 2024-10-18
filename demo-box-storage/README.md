# Box Storage Demo
This is a demo on the various functions for storage boxes. The smart contract allows users to perform app calls related to storage boxes.

The box storage functions are 

### create_box
Creates a box with a name and specified size.

### box_put
Creates a box based on the input data size and puts the data inside.

### box_replace
Replaces the data in the box from the start position of the stored byte value.

### box_read
Reads the data from the box in the contract.

### box_extract
Reads parts of the data from the box in the contract, if it is more than 4kb.

### box_length
Gets the size of the box

### box_delete
Deletes the box

## Run the demo
Run the functions to submit the necessary app call transactions related to box storage,

To reuse the deployed app, save the app ID in the `.env` folder after running the first script. Run `source .env` first before running the rest of the scripts.

```
node 01_create_empty_box.js
node 02_create_box_with_data.js
node 03_read_box_data.js 
node 04_replace_box_data.js
node 05_extract_box_data.js
node 06_delete_box.js
node 07_box_with_long_data.js
```

## Requirements
1. pyTEAL v0.20.1
2. algosdk >= v1.23.2

## References
- [https://developer.algorand.org/articles/smart-contract-storage-boxes/](https://developer.algorand.org/articles/smart-contract-storage-boxes/)
- [https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#box-details](https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#box-details)