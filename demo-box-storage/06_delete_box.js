const boxfn = require("./box");
const { getApp } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  // delete a box
  const boxName = "empty_box_1";
  await boxfn.boxDelete(appId, boxName);
})();
