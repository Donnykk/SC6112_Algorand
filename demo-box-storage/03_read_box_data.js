const boxfn = require("./box");
const { getApp } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  const boxName = "box_with_data";

  // read box data in contract and update global state
  await boxfn.boxRead(appId, boxName);

  // read box length in contract and update global state
  await boxfn.boxLength(appId, boxName);
})();
