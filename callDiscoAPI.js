#!/usr/bin/env node
import axios from "axios";
import fs from "fs";

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {

    const formattedJson = { body: JSON.parse(fs.readFileSync("NP20BBF047.json")) };

    await axios.put(
      "https://agentdev.nglic.com/api/disco/upload",
      formattedJson,
      {
        headers: {
          "x-api-key": "",
          "Policy-Number": "NP20BBF047",
          "Content-Type": "application/json"
        },
        timeout: 5000,
        validateStatus: (status) =>
          /* istanbul ignore next */
          status < 400 ||
          status === 404 ||
          status === 408 ||
          status === 504
      }
    );
  } catch(e)
  {
    console.log(e)
  }
};


(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();