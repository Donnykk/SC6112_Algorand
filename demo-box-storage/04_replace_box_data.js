const boxfn = require("./box");
const { getApp } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  // replace data in box
  const boxName = "box_with_data";
  const boxData = "B".repeat(10);
  await boxfn.boxReplaceData(appId, boxName, 0, boxData);

  // read box data in contract and update global state
  await boxfn.boxRead(appId, boxName);
})();
