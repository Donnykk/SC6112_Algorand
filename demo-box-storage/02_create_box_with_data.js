const boxfn = require("./box");
const { getApp, topupContract } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  // using box_put to create a box with data
  const boxName = "box_with_data";
  const boxData = "A".repeat(100); //app args are limited to 2KB
  const boxSize = new Uint8Array(Buffer.from(boxData)).length;
  await topupContract(appId, boxName, boxSize);
  await boxfn.boxPut(appId, boxName, boxData);

  // print created box
  const appBoxNames = await boxfn.getAppBoxNames(appId);
  console.log("app boxes:", appBoxNames);
})();
