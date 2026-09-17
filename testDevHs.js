#!/usr/bin/env node
import axios from "axios";
import { program } from "commander";
import fs from "fs";

program
  .option("-f, --inputFile <type>", "JSON Policy file to process")
  .option("-f, --outputFile <type>", "JSON Policy file to process")
  .option("-apiKey, --apiKey <type>", "API Key")
  .option("-h, --host <type>", "Hierarchy Service host");

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    program.parse();
    const options = program.opts();

    const policies = JSON.parse(fs.readFileSync(options.inputFile))

    fs.writeFileSync(options.outputFile, `There were ${policies.length} policies found\r\n`, { flag: 'a' });
    console.log(`There were ${policies.length} policies found`)

    let hierarchyFoundCounter = 0;

    for (const policy in policies) {
      let queryString = `producer=${policies[policy].producer}&plan=${policies[policy].plan}&state=${policies[policy].state}&age=${policies[policy].age}&class=${policies[policy].class}&&isCC=${policies[policy].isCC}&payPeriod=${policies[policy].payPeriod}`;

      if (policies[policy].funeralHomePinId)
        queryString = `${queryString}&funeralHomePinId=${policies[policy].funeralHomePinId}`;

      if (policies[policy].alphaGrowthRate)
        queryString = `${queryString}&alphaGrowthRate=${policies[policy].alphaGrowthRate}`;

      try {
        const axiosResult = await getHierarchyData(options.host, queryString, options.apiKey);
        fs.writeFileSync(options.outputFile, `${queryString}\r\n`, { flag: 'a' });
        console.info(queryString)
        fs.writeFileSync(options.outputFile, `${JSON.stringify(axiosResult, null, 2)}\r\n`, { flag: 'a' });
        hierarchyFoundCounter++;
      }
      catch (err) {
        fs.writeFileSync(options.outputFile, `No hierarchy found for ${queryString}\r\n`, { flag: 'a' });
        console.log(`No hierarchy found for ${queryString}`)
      }
    }

    fs.writeFileSync(options.outputFile, `Out of ${policies.length}, ${hierarchyFoundCounter} hierarchies were found`, { flag: 'a' });
    console.log(`Out of ${policies.length}, ${hierarchyFoundCounter} hierarchies were found`)

  } catch (err) {
    console.log(`An ERROR has occurred: ${err}`);
  }
};

const getHierarchyData = async (host, queryString, apiKey) => {
  const response =  await axios
    .get(
      `https://${host}/api/hierarchy/hierarchyPlanData?${queryString}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/x-www-form-urlencoded",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

  return response.data;
};

(async () => {
  // Sample call: node testDevHs.js --apiKey <your-api-key> --inputFile old-appqore-policies-precoa-20230425.json --outputFile output-precoa.log
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
