const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN,
  process.env.ALGOD_SERVER,
  process.env.ALGOD_PORT
);

const submitToNetwork = async (signedTxns) => {
  // send txn
  const response = await algodClient.sendRawTransaction(signedTxns).do();

  // Wait for transaction to be confirmed
  const confirmation = await algosdk.waitForConfirmation(
    algodClient,
    response.txId,
    4
  );

  return {
    response,
    confirmation,
  };
};

const generateLogicSignatureForAccount = async (relativeFilePath, account) => {
  // Compile to TEAL
  const filePath = path.join(__dirname, relativeFilePath);
  const data = fs.readFileSync(filePath);
  const compiledProgram = await algodClient.compile(data).do();

  // Create logic signature for sender account
  const programBytes = new Uint8Array(
    Buffer.from(compiledProgram.result, "base64")
  );

  const lsig = new algosdk.LogicSigAccount(programBytes);
  lsig.sign(account.sk);

  return lsig;
};

const paymentTxn = async (from, to, amount) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount,
    suggestedParams,
  });
};

const assetCreateTxn = async (creatorAddr) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: creatorAddr,
    assetName: "TESTASSET",
    total: 1,
    decimals: 0,
    defaultFrozen: false,
    unitName: "TA",
    assetURL: "ipfs://cid",
    suggestedParams,
  });
};

const assetOptInTxn = async (accAddr, assetId) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: accAddr,
    to: accAddr,
    assetIndex: assetId,
    suggestedParams,
  });
};

const assetTransferTxn = async (from, to, amount, assetId) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount,
    assetIndex: assetId,
    suggestedParams,
  });
};

const performAtomic = async (creatorAccount, logicSig, assetId) => {
  // 3 txns
  const txn1 = await assetOptInTxn(logicSig.address(), assetId);
  const txn2 = await paymentTxn(logicSig.address(), creatorAccount.addr, 5e6); // 5 algos
  const txn3 = await assetTransferTxn(
    creatorAccount.addr,
    logicSig.address(),
    1,
    assetId
  );

  const groupedTxn = algosdk.assignGroupID([txn1, txn2, txn3]);

  const signedTxns = groupedTxn.map((txn, index) => {
    if (index === 2) {
      return txn.signTxn(creatorAccount.sk);
    }

    return algosdk.signLogicSigTransactionObject(txn, logicSig).blob;
  });

  return await submitToNetwork(signedTxns);
};

const createAsset = async (creatorAccount) => {
  const txn = await assetCreateTxn(creatorAccount.addr);
  const signedTxn = txn.signTxn(creatorAccount.sk);

  const { confirmation } = await submitToNetwork(signedTxn);

  return confirmation["asset-index"];
};

const accountInfo = async (addr) => {
  return await algodClient.accountInformation(addr).do();
};

module.exports = {
  submitToNetwork,
  generateLogicSignatureForAccount,
  performAtomic,
  createAsset,
  accountInfo,
};
