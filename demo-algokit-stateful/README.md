# Stateful Smart Contract Demo
Sample stateful smart contract to demostrate some of the commonly used functions

1. Sending inner transactions with Smart Contract
2. Submitting application call transactions with the different arrays (application, accounts)
3. Reading global / local state using the SDK

## Setup instructions

### Install python packages via AlgoKit
run `algokit bootstrap poetry` within this folder

### Install JS packages
run `yarn install`

### Update environement variables
1. Copy `.env.example` to `.env`
2. Update Algorand Sandbox credentials in `.env` file
3. Update accounts in `.env` file

### Initialize virtual environment
run `poetry shell`

### Compile contracts
1. run `python ab_approval.py`
2. run `python ab_clearstate.py`

### Deploy App
1. run `node scripts/deploy.js`
2. Save deployed application ID to `.env` file

### Updating Global State
run `node scripts/actions/update_gs.js`

### Updating Local State
run `node scripts/actions/update_ls.js`

### Issue Inner Transaction
run `node scripts/actions/inner_txn.js`