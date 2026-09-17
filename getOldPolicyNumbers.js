#!/usr/bin/env node
import axios from "axios";
import {
  environments,
  getAuthToken,
  sendUnqorkApiGetRequest,
} from "./common.js";
import { parseUnderwritingClass } from "./underwritingClass.js";
import { program } from "commander";
import moment from "moment";
import fs from "fs";

program
  .option(
    "-e, --env <type>",
    "Set the environment on which the script will run. Required.",
    "staging"
  )
  .option("-p, --password <type>", "Set the password for the environment")
  .option("-apiKey, --apiKey <type>", "API Key");

const PRECOA_WORKFLOW_ID = "5eafdf4ba6690f01f847b95a";
const PAGE_SIZE = 50;

const getID3PayPeriod = (uwClass, isSinglePay, payPeriod) => {
  if (uwClass === "Z") return "A";
  else if (isSinglePay) return "SP";
  else return payPeriod;
};

const getPoliciesFromAppQore = async (baseUrl, workflowId, authToken) => {
  const results = [];
  const policies = [];

  let offset = 0;
  let keepGoing = true;

  try {
    while (keepGoing) {
      const result = await sendUnqorkApiGetRequest(
        `${baseUrl}/workflows/${workflowId}/submissions?filter=created<2022-11-30T00:00:00Z;created>2023-06-01T00:00:00Z&offset=${offset}&limit=${PAGE_SIZE}&dataFields=numPolicynumber,appStatus,drpAvailablePlans,drpProductPrecoa,drpProductPreneed,agentTPMBranchCode,agentCompanyProducerID`,
        authToken
      );
      results.push.apply(results, result);
      offset += PAGE_SIZE;

      if (result.length < PAGE_SIZE) {
        keepGoing = false;
      }
    }
  } catch (ex) {
    console.error(ex);
  }

  for (const policy in results) {
    if (results[policy].data.rawData.appStatus === "In Progress") {
      policies.push(results[policy].data.rawData);
      if(results[policy].data.rawData.numPolicynumber) {
        console.log(JSON.stringify(results[policy].data.rawData, null, 2))
      }
    }
  }

  return policies;
};

/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  program.parse();
  const options = program.opts();

  const environment = environments[options.env];
  const baseUrl = `${environment.url}/api/1.0`;
  const authToken = await getAuthToken(
    `${baseUrl}/oauth2/access_token`,
    environment.username,
    options.password
  );

  await getPoliciesFromAppQore(
    baseUrl,
    PRECOA_WORKFLOW_ID,
    authToken
  );
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
