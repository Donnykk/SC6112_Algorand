const boxfn = require("./box");
const { getApp, topupContract } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  // create box with defined storage size
  const boxName = "empty_box_1"; // 64 bytes max
  const boxSize = 4 * 1024; // bytes
  await topupContract(appId, boxName, boxSize);
  await boxfn.boxCreate(appId, boxName, boxSize);

  // print created box
  const appBoxNames = await boxfn.getAppBoxNames(appId);
  console.log("app boxes:", appBoxNames);
})();
