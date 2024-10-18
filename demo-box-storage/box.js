const algosdk = require("algosdk");
const { getAlgodClient } = require("./client");
const { appCall } = require("./boxapp");
const { submitAtomicToNetwork, readGlobalState } = require("./helpers");
require("dotenv").config();

const algodClient = getAlgodClient("SandNet"); // SandNet | TestNet
const creator = algosdk.mnemonicToSecretKey(process.env.MASTER_MNEMONIC);

const boxCreate = async (appId, boxName, size) => {
  // create box
  const appArgs = [
    new Uint8Array(Buffer.from("create_box")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
    algosdk.encodeUint64(size)
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, size);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  console.log(await getBoxByName(appId, boxName));
}

const boxPut = async (appId, boxName, data) => {
  // format box data
  const boxData = formatAppData(data);

  // put data in box - max 16 app args, 2KB in total size limit
  const appArgs = [
    new Uint8Array(Buffer.from("box_put")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
    boxData
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, boxData.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  console.log(await getBoxByName(appId, boxName));
}

const boxDelete = async (appId, boxName) => {
  const thisBox = await getBoxByName(appId, boxName);

  // put data in box
  const appArgs = [
    new Uint8Array(Buffer.from("box_delete")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, thisBox.data.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  // print remaining boxes
  console.log("app boxes:", await getAppBoxNames(appId));
}

const boxReplaceData = async (appId, boxName, start, newData) => {
  const boxData = formatAppData(newData);
  const thisBox = await getBoxByName(appId, boxName);

  if (boxData.length >= thisBox.data.length) {
    throw new Error("End position exceeds size of the box");
  }

  if (start >= thisBox.data.length) {
    throw new Error("Start position exceeds size of the box");
  }

  const appArgs = [
    new Uint8Array(Buffer.from("box_replace")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
    algosdk.encodeUint64(start),
    boxData
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, thisBox.data.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);
}

const boxExtract = async (appId, boxName, start, extractLen) => {
  const thisBox = await getBoxByName(appId, boxName);

  if (extractLen >= thisBox.data.length) {
    throw new Error("Extract data length is too long");
  }

  if (start >= thisBox.data.length) {
    throw new Error("Start position exceeds size of the box");
  }

  const appArgs = [
    new Uint8Array(Buffer.from("box_extract")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
    algosdk.encodeUint64(start),
    algosdk.encodeUint64(extractLen)
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, thisBox.data.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  console.log(await readGlobalState(appId));
}

const boxRead = async (appId, boxName) => {
  const thisBox = await getBoxByName(appId, boxName);

  const appArgs = [
    new Uint8Array(Buffer.from("box_read")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, thisBox.data.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  console.log(await readGlobalState(appId));
}

const boxLength = async (appId, boxName) => {
  const thisBox = await getBoxByName(appId, boxName);

  const appArgs = [
    new Uint8Array(Buffer.from("box_length")),
    new Uint8Array(Buffer.from(boxName)), // 1-64 bytes, unique for the app
  ];

  // box array
  const boxArgs = formatBoxArrayForTxn(boxName, thisBox.data.length);

  const txn = await appCall(creator, appId, appArgs, boxArgs, [], [], []);
  const signedTxn = txn.signTxn(creator.sk);
  await submitAtomicToNetwork([signedTxn]);

  console.log(await readGlobalState(appId));
}

const formatBoxArrayForTxn = (boxName, boxSize) => {
  // Each box ref in box array can only access 1K byte of box state
  console.log("box size:", boxSize);
  const slotsNeeded = Math.ceil(boxSize / 1024);
  console.log("slots needed: ", slotsNeeded);

  // 1 transaction can allow 8 slots at max
  if (slotsNeeded > 8) {
    throw new Error("Exceeded 8 slots for foreign arrays in a transaction");
  }

  // Start with name of the box
  let boxArray = [
    {
      appIndex: 0,
      name: new Uint8Array(Buffer.from(boxName))
    }
  ];

  // Empty slots
  const emptySlot = {
    appIndex: 0,
    name: new Uint8Array()
  };

  // Add empty slots
  let i = 1;
  while (i < slotsNeeded) {
    boxArray.push(emptySlot);
    i++;
  }

  // Box array ref shares the total number of objects across other arrays (8)
  console.log("box array:", boxArray);
  return boxArray;
}

const formatAppData = (data) => {
  // format box data
  let output;
  if (typeof(data) === "number") {
    output = algosdk.encodeUint64(data);
  } else {
    output = new Uint8Array(Buffer.from(data));
  }

  return output;
}

const getBoxByName = async (appId, boxName) => {
  const res = await algodClient.getApplicationBoxByName(appId, new Uint8Array(Buffer.from(boxName))).do();

  // format output
  return {
    name: new TextDecoder().decode(res.name),
    data: res.value,
  }
}

const getAppBoxNames = async (appId) => {
  const res = await algodClient.getApplicationBoxes(appId).do();

  const textDecoder = new TextDecoder();
  return res.boxes.map(box => {
    return textDecoder.decode(box.name)
  });
}

module.exports = {
  boxCreate,
  boxPut,
  boxDelete,
  boxReplaceData,
  boxExtract,
  boxRead,
  boxLength,
  getBoxByName,
  getAppBoxNames
};
