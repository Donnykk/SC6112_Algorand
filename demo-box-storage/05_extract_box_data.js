const boxfn = require("./box");
const { getApp } = require("./boxapp");
require("dotenv").config();

(async () => {
  // Get app
  const appId = await getApp();

  const boxName = "box_with_data";

  // Extract data from box in contract and update global state
  await boxfn.boxExtract(appId, boxName, 0, 10);
})();
