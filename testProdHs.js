#!/usr/bin/env node
import axios from "axios";
import { program } from "commander";
import fs from "fs";
import fetch from "node-fetch";

program
  .option("-apiKey, --apiKey <type>", "API Key");

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    program.parse();
    const options = program.opts();

    const policies = JSON.parse(fs.readFileSync('old-appqore-policies-precoa-20240214.json'))

    fs.writeFileSync(`output-prod.log`, `There were ${policies.length} policies found\r\n`, { flag: 'a' });
    console.log(`There were ${policies.length} policies found`)

    let hierarchyFoundCounter = 0;

    for (const policy in policies) {
      let queryString = `producer=${policies[policy].producer}&plan=${policies[policy].plan}&state=${policies[policy].state}&age=${policies[policy].age}&class=${policies[policy].class}&&isCC=${policies[policy].isCC}&payPeriod=${policies[policy].payPeriod}`;

      if (policies[policy].funeralHomePinId)
        queryString = `${queryString}&funeralHomePinId=${policies[policy].funeralHomePinId}`;

      if (policies[policy].alphaGrowthRate)
        queryString = `${queryString}&alphaGrowthRate=${policies[policy].alphaGrowthRate}`;

      try {
        const response = await fetch("https://apigateway.us-east-2.amazonaws.com/restapis/0coinqlnmg/resources/4t05mp/methods/GET", {
          "headers": {
            "accept": "application/json",
            "content-type": "application/json"
          },
          "body": "{\"pathWithQueryString\":\"/hierarchyPlanData?producer=TESTFGHIJ&plan=Series 64&state=VA&age=73&class=A&&isCC=false&payPeriod=3&alphaGrowthRate=B\",\"body\":\"\",\"headers\":{},\"multiValueHeaders\":{},\"stageVariables\":{}}",
          "method": "POST"
        });

        const resBody = await response.json();

        console.info('After call')
        console.info(resBody)
        const hierarchy = JSON.parse(resBody.body);

        fs.writeFileSync(`output-prod.log`, `${queryString}\r\n`, { flag: 'a' });
        console.info(queryString)
        fs.writeFileSync(`output-prod.log`, `${JSON.stringify(hierarchy, null, 2)}\r\n`, { flag: 'a' });
        hierarchyFoundCounter++;
      }
      catch (err) {
        fs.writeFileSync(`output-prod.log`, `No hierarchy found for ${queryString}\r\n`, { flag: 'a' });
        console.log(`No hierarchy found for ${queryString}`)
        console.log(err.message)
      }
    }

    fs.writeFileSync(`output-prod.log`, `Ouf of ${policies.length}, ${hierarchyFoundCounter} hierarchies were found`, { flag: 'a' });
    //console.log(`Ouf of ${policies.length}, ${hierarchyFoundCounter} hierarchies were found`)

  } catch (err) {
    console.log(`An ERROR has occurred: ${err}`);
  }
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
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
