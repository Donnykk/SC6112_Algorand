const algosdk = require("algosdk");
const { getAlgodClient } = require("./client");
require("dotenv").config();

const algodClient = getAlgodClient("SandNet"); // SandNet | TestNet

const submitAtomicToNetwork = async (txns) => {
  const { txn } = algosdk.decodeSignedTransaction(txns[txns.length - 1]);

  // send txn
  let tx = await algodClient.sendRawTransaction(txns).do();
  console.log("Transaction : " + tx.txId);

  // check results of very last txn
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txn.txID(), 30);

  return confirmedTxn;
}

const readGlobalState = async (appId) => {
  const app = await algodClient.getApplicationByID(appId).do();
  
  // global state is a key value array
  const globalState = app.params["global-state"];
  const textDecoder = new TextDecoder();
  const gsmap = new Map();
  globalState.forEach(item => {
    // decode from base64 and utf8
    const formattedKey = textDecoder.decode(Buffer.from(item.key, "base64"));

    let formattedValue;
    if (item.value.type === 1) {
      formattedValue = textDecoder.decode(Buffer.from(item.value.bytes, "base64"));
    } else {
      formattedValue = item.value.uint;
    }

    gsmap.set(formattedKey, formattedValue);
  });

  return gsmap;
}

module.exports = {
  submitAtomicToNetwork,
  readGlobalState
};
