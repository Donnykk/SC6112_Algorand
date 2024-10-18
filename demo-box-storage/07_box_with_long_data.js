const boxfn = require("./box");
const { getApp, topupContract } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  // using box_put to create a box with data
  const boxName = "box_with_2kb_data";

  /**
   * For 1 app call txn, determine max length of data I can put into a box
   * Arg total size limit => 2048 bytes
   * Arg 0 (box_put) => 7 bytes
   * Arg 1 (box_with_2kb_data) => 17 bytes
   * Remaining bytes = 2024 bytes
   */
  const bstring = "B".repeat(24);
  const cstring = "C".repeat(2000); //app args are limited to 2KB
  const boxData = bstring.concat(cstring);
  const boxSize = new Uint8Array(Buffer.from(boxData)).length;
  await topupContract(appId, boxName, boxSize);
  await boxfn.boxPut(appId, boxName, boxData);

  // print created box
  const appBoxNames = await boxfn.getAppBoxNames(appId);
  console.log("app boxes:", appBoxNames);

  // unable to read and save this box's data to global state due to storage limit of 128 bytes (key + value)
  // await boxfn.boxRead(appId, boxName);
  
  // read box length in contract and update global state
  await boxfn.boxLength(appId, boxName);

  // extract bstring from box and save in global state
  await boxfn.boxExtract(appId, boxName, 0, 24);
})();
