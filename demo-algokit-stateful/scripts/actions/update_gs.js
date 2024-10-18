require("dotenv").config();
const algotxn = require("../helpers/algorand");
const algosdk = require("algosdk");

(async () => {
  const appId = Number(process.env.APP_ID);

  const creator = algosdk.mnemonicToSecretKey(process.env.CREATOR_MNEMONIC);

  // call the app to update global state
  const appArgs = [
    new Uint8Array(Buffer.from("UpdateGlobal")),
    new Uint8Array(Buffer.from("acc1")),
    algosdk.encodeUint64(10),
  ];

  await algotxn.callApp(creator, appId, appArgs);

  // read app global state
  const appGS = await algotxn.readGlobalState(appId);
  console.log(appGS);
})();
