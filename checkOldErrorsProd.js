#!/usr/bin/env node
import axios from "axios";
import fetch from "node-fetch";
import fs from "fs";

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  let hierarchiesFound = 0;
  try {
    const policies = JSON.parse(
      fs.readFileSync("no-hierarchy-or-plandata-found-20221101-20221208.json")
    );
    console.info(`POLICIES WITH MISSING HIERARCHIES: ${policies.length}`);

    let counter = 1;

    for (const policy in policies) {
      let queryString;
      if (policies[policy].funeralHomePinId)
        queryString = `producer=${policies[policy].producerId}&plan=${policies[policy].planName}&state=${policies[policy].state}&age=${policies[policy].insuredAge}&class=${policies[policy].underwritingClass}&&isCC=${policies[policy].isCreditCard}&payPeriod=${policies[policy].payPeriod}&funeralHomePinId=${policies[policy].funeralHomePinId}`;
      else
        queryString = `producer=${policies[policy].producerId}&plan=${policies[policy].planName}&state=${policies[policy].state}&age=${policies[policy].insuredAge}&class=${policies[policy].underwritingClass}&&isCC=${policies[policy].isCreditCard}&payPeriod=${policies[policy].payPeriod}`;

      try {
        const response = await fetch(
          "https://us-east-2.console.aws.amazon.com/apigateway/api/apigateway",
          {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9",
              "cache-control": "no-cache",
              "content-type": "application/json",
              pragma: "no-cache",
              "sec-ch-ua":
                '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-csrf-token": "<set-csrf-token-locally>",
              "cookie": "<set-cookie-locally>",
              Referer:
                "https://us-east-2.console.aws.amazon.com/apigateway/home?region=us-east-2",
              "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            body: `{\"headers\":{\"X-Amz-User-Agent\":\"aws-sdk-js/2.589.0 promise\",\"Content-Type\":\"application/json\",\"Accept\":\"application/json\"},\"path\":\"/restapis/0coinqlnmg/resources/4t05mp/methods/GET\",\"method\":\"POST\",\"region\":\"us-east-2\",\"params\":{},\"contentString\":\"{\\\"body\\\":\\\"\\\",\\\"headers\\\":{},\\\"multiValueHeaders\\\":{},\\\"pathWithQueryString\\\":\\\"/hierarchyPlanData?${queryString}\\\",\\\"stageVariables\\\":{}}\",\"operation\":\"testInvokeMethod\"}`,
            method: "POST",
          }
        );

        const resBody = await response.json();
        const policy = JSON.parse(resBody.body);

        if (!policy["mnemonic"]) {
          console.info(`${counter}. MISSING: ${queryString}`);
        } else {
          console.info(
            `${counter}. FOUND: ${policy["mnemonic"]} ${queryString}`
          );
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

  console.info(`FOUND HIEARCHIES FOR ${hierarchiesFound} Policies`);
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();

