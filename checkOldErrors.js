#!/usr/bin/env node
import axios from "axios";
import { program } from "commander";
import fs from "fs";

program
  .option("-apiKey, --apiKey <type>", "API Key");

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  let hierarchiesFound = 0;
  try {
    program.parse();
    const options = program.opts();

    const policies = JSON.parse(fs.readFileSync('no-hierarchy-or-plandata-found-20221101-20221208.json'))
    console.info(`POLICIES WITH MISSING HIERARCHIES: ${policies.length}`)

    let counter = 1;

    for (const policy in policies) {
      let axiosResult;
      let queryString;
      if(policies[policy].funeralHomePinId)
        queryString = `producer=${policies[policy].producerId}&plan=${policies[policy].planName}&state=${policies[policy].state}&age=${policies[policy].insuredAge}&class=${policies[policy].underwritingClass}&&isCC=${policies[policy].isCreditCard}&payPeriod=${policies[policy].payPeriod}&funeralHomePinId=${policies[policy].funeralHomePinId}`;
      else
        queryString = `producer=${policies[policy].producerId}&plan=${policies[policy].planName}&state=${policies[policy].state}&age=${policies[policy].insuredAge}&class=${policies[policy].underwritingClass}&&isCC=${policies[policy].isCreditCard}&payPeriod=${policies[policy].payPeriod}`;

      try {
        axiosResult = await getHierarchyData(queryString, options.apiKey);

        if(!axiosResult){
          console.info(`${counter}. MISSING: ${queryString}`);
        } else {
          console.info(`${counter}. FOUND: ${queryString}`)
          hierarchiesFound++;
        }

      } catch (err) {
        // console.log(`MISSING: ${queryString}`);
      }
      counter++;
    }
  } catch (err) {
    console.log(`An ERROR has occurred: ${err}`);
  }

  console.info(`FOUND HIEARCHIES FOR ${hierarchiesFound} Policies`)
};

const getHierarchyData = async (queryString, apiKey) => {
  return axios
    .get(
      `https://agentdev.nglic.com/api/hierarchy/hierarchyPlanData?${queryString}`,
      {
        headers: {
          "x-api-key": apiKey,
          Accept: "application/x-www-form-urlencoded",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((response) => response.data)
    .catch((err) => {
      // console.info(`MISSING: ${queryString}`);
    });
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
