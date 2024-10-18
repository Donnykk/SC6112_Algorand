const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");
const { getAlgodClient } = require("./client");
const { submitAtomicToNetwork } = require("./helpers");
require("dotenv").config();

const algodClient = getAlgodClient("SandNet"); // SandNet | TestNet
const creator = algosdk.mnemonicToSecretKey(process.env.MASTER_MNEMONIC);

const getBasicProgramBytes = async (filename) => {
  // Read file for Teal code
  const filePath = path.join(__dirname, filename);
  const data = fs.readFileSync(filePath);

  // use algod to compile the program
  const compiledProgram = await algodClient.compile(data).do();
  return new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
};

const deployApp = async () => {
  // define application parameters
  const from = creator.addr;
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;
  const approvalProgram = await getBasicProgramBytes("./artifacts/sc_approval.teal");
  const clearProgram = await getBasicProgramBytes("./artifacts/sc_clearstate.teal");
  const numLocalInts = 0;
  const numLocalByteSlices = 0;
  const numGlobalInts = 1; //saves length data stored in box
  const numGlobalByteSlices = 2; //saves box data and extracted box data
  const appArgs = [];

  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // create the application creation transaction
  const createTxn = algosdk.makeApplicationCreateTxn(
    from,
    suggestedParams,
    onComplete,
    approvalProgram,
    clearProgram,
    numLocalInts,
    numLocalByteSlices,
    numGlobalInts,
    numGlobalByteSlices,
    appArgs
  );

  const signedCreateTxn = createTxn.signTxn(creator.sk);
  const confirmedTxn = await submitAtomicToNetwork([signedCreateTxn]);
  
  // read global state
  const appId = confirmedTxn["application-index"];

  // fund contract with 0.1 algos
  const appAddr = algosdk.getApplicationAddress(appId); 
  await transferAlgos(appAddr, 1e5);
  
  return appId;
}

const appCall = async (sender, appId, appArgs, boxArr, assets, accounts, apps) => {
  // get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // call the created application
  const data = {
    from: sender.addr,
    appIndex: appId,
    suggestedParams,
    appArgs,
  }

  // add foreign arrays if provided
  if (assets.length > 0) {
    data.foreignAssets = assets;
  }

  if (apps.length > 0) {
    data.foreignApps = apps;
  }

  if (accounts.length > 0) {
    data.accounts = accounts;
  }

  if (boxArr.length > 0) {
    data.boxes = boxArr
  }

  const callTxn = algosdk.makeApplicationNoOpTxnFromObject(data);

  return callTxn;
}

const transferAlgos = async (to, amount) => {
  console.log(`Transferring ${amount} microalgos from ${creator.addr} to ${to}`);
  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: creator.addr,
    to,
    amount,
    suggestedParams
  });

  const signedTxn = txn.signTxn(creator.sk);
  return await submitAtomicToNetwork([signedTxn]);
}

const topupContract = async (appId, boxName, boxSize) => {
  // if contract does not have enough balance to create box, do topup
  const appAddr = algosdk.getApplicationAddress(appId);
  const acc = await algodClient.accountInformation(appAddr).do();
  console.log(acc);

  // min balance to create box
  const minBalance = 2500 + (400 * (boxName.length + boxSize));
  console.log(`Box requires ${minBalance} microAlgos, ${minBalance / 1e6} Algos`);
  if (acc["amount"] < (acc["min-balance"] + minBalance)) {
    await transferAlgos(appAddr, minBalance);
  }
}

const getApp = async () => {
  // deploy app
  let appId;
  if (process.env.APP_ID !== "") {
    appId = Number(process.env.APP_ID);
  } else {
    appId = await deployApp();
  }

  console.log("APP ID is:", appId);

  return appId;
}

module.exports = {
  appCall,
  topupContract,
  getApp
};
