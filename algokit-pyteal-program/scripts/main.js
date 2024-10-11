const algosdk = require("algosdk");
require("dotenv").config();
const {
  createAsset,
  performAtomic,
  generateLogicSignatureForAccount,
  accountInfo,
} = require("./algorand");

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);
  const receiver = algosdk.mnemonicToSecretKey(process.env.RECEIVER_MNEMONIC);

  // create asset
  const assetId = await createAsset(creator);
  console.log("asset created: ", assetId);

  // generate logic sig based on program
  const lsig = await generateLogicSignatureForAccount(
    "../artifacts/pyteal_program.teal",
    receiver
  );

  // atomic transfer with 3 txns - asset optin, asset transfer and payment
  await performAtomic(creator, lsig, assetId);

  // check receiver's asset list
  console.log((await accountInfo(receiver.addr)).assets);
})();
