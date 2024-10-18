require("dotenv").config();
const algotxn = require("../helpers/algorand");
const algosdk = require("algosdk");

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

(async () => {
  const appId = Number(process.env.APP_ID);
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);
  const acc1 = algosdk.mnemonicToSecretKey(process.env.ACC1_MNEMONIC);

  // acc1 initial algos
  const acc1Initial = await algodClient.accountInformation(acc1.addr).do();

  // call the app to update global state
  const appArgs = [
    new Uint8Array(Buffer.from("SendAlgos")),
    algosdk.encodeUint64(1e6),
  ];

  // indicate receiver account
  const accounts = [acc1.addr];

  // make an app call txn
  let suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = 2000; // sender pays extra 1000 mA to cover inner txn

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: creator.addr,
    suggestedParams,
    appIndex: appId,
    appArgs,
    accounts,
  });

  const signedTxn = txn.signTxn(creator.sk);
  await algotxn.submitToNetwork(signedTxn);

  // acc1 balance
  const acc1After = await algodClient.accountInformation(acc1.addr).do();
  console.log("Algos sent:", acc1After.amount - acc1Initial.amount);
})();
