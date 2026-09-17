#!/usr/bin/env node
import axios from "axios";
import {
  environments,
  getAuthToken,
  sendUnqorkApiGetRequest,
} from "./common.js";
import { program } from "commander";
import fs from "fs";
import moment from "moment/moment.js";
import { parseUnderwritingClass } from "./underwritingClass.js";

program
  .option(
    "-e, --env <type>",
    "Set the environment on which the script will run. Required.",
    "staging"
  )
  .option("-p, --password <type>", "Set the password for the environment")
  .option("-apiKey, --apiKey <type>", "API Key")
  .option("--product <type>", "Product to determine which workflow to use");

const PRECOA_WORKFLOW_ID = "5eafdf4ba6690f01f847b95a";
const PRENEED_WORKFLOW_ID = "5eb0182c3b877e01f970ffa3";
const PAGE_SIZE = 50;

const getPoliciesFromAppQore = async (baseUrl, workflowId, authToken) => {
  const results = [];
  const policies = [];

  let offset = 0;
  let keepGoing = true;

  try {
    while (keepGoing) {
      const result = await sendUnqorkApiGetRequest(
        `${baseUrl}/workflows/${workflowId}/submissions?filter=data.drpProduct=\"Precoa-Carriage\"&offset=${offset}&limit=${PAGE_SIZE}&dataFields=numPolicynumber,drpProduct,drpProductPrecoa,drpProductPreneed,plan,PRODUCT,radAnnuity,radTerminal,hdnProductCode,hdnPayPeriod,hdnDisposition,drpState,agentCompanyProducerID,dateDateofBirth,appStatus,agentTPMBranchCode,agentCompanyProducerID,FuneralHomePINID,hdnAgentName,stxtTempName,hdnTemplateSharedByUserNameID,created&sortBy=created&sortOrder=-1`,
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
    if (results[policy].data.rawData.appStatus === "Received by NGL") {
      results[policy].data.rawData.created = results[policy].created
      policies.push(results[policy].data.rawData);
    }
  }

  return policies;
};

const parseAppQorePolicies = async (policies) => {
  const results = [];

  for (const policy in policies) {
    if (policies[policy].dateDateofBirth) {
      const dateOfBirth = moment(policies[policy].dateDateofBirth);
      policies[policy].age = moment().diff(dateOfBirth, "years");
    }

    if (policies[policy].drpPaymentTypeInitial !== undefined) {
      policies[policy].isCC = policies[policy].drpPaymentTypeInitial.toLowerCase() === "cc" ||
        policies[policy].drpPaymentTypeInitial.toLowerCase() === "creditcard";
    } else {
      policies[policy].isCC = false;
    }

    let underwritingClass;

    try {

      underwritingClass = await parseUnderwritingClass(policies[policy]);
    }
    catch{

    }

    let payPeriod = "0";

    if(underwritingClass === "Z") {
      payPeriod = "A"
    } else if (policies[policy].hdnPayPeriod && policies[policy].hdnPayPeriod == "0") {
      payPeriod = "SP";
    }
    else if (policies[policy].hdnPayPeriod && policies[policy].hdnPayPeriod != "0") {
      payPeriod = parseInt(policies[policy].hdnPayPeriod);
    } else {
      payPeriod = parseInt(policies[policy].multiPayLife ? policies[policy].multiPayLife : "0");
    }

    try {
      results.push({
        numPolicynumber: policies[policy].numPolicynumber,
        producer: policies[policy].agentCompanyProducerID,
        state: policies[policy].drpState,
        plan: policies[policy].drpProductPrecoa ?? policies[policy].drpProductPreneed,
        age: policies[policy].age,
        class: underwritingClass,
        isCC: policies[policy].isCC,
        payPeriod: payPeriod,
        funeralHomePinId: policies[policy].FuneralHomePINID ?? undefined,
        agentTPMBranchCode: policies[policy].agentTPMBranchCode,
        agentCompanyProducerID: policies[policy].agentCompanyProducerID,
        hdnAgentName: policies[policy].hdnAgentName,
        hdnDisposition: policies[policy].hdnDisposition,
        appStatus: policies[policy].appStatus,
        template: policies[policy].stxtTempName,
        created: policies[policy].created,
        signatureCombinations: policies[policy].signatureCombinations,
        product: policies[policy].PRODUCT,
        hdnTemplateSharedByUserNameID: policies[policy].hdnTemplateSharedByUserNameID
      })
    }
    catch (ex){
      console.log(ex.message)
    }
  }
  return results;
};


/**
 * Main entry point of the application
 * @returns {Promise<void>}
 */
const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    program.parse();
    const options = program.opts();

    const environment = environments[options.env];
    const product = options.product;
    const baseUrl = `${environment.url}/api/1.0`;
    const authToken = await getAuthToken(
      `${baseUrl}/oauth2/access_token`,
      environment.username,
      options.password
    );

    const workflow = product.toLowerCase() === "preneed"?PRENEED_WORKFLOW_ID:PRECOA_WORKFLOW_ID;

    const policiesFromAppQore = await getPoliciesFromAppQore(
      baseUrl,
      workflow,
      authToken
    );

    const policies = await parseAppQorePolicies(policiesFromAppQore);

    fs.writeFileSync(
      `old-appqore-policies-${product.toLowerCase()}-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}.json`,
      JSON.stringify(policies, null, 2)
    );

  } catch (err) {
    console.log(`An ERROR has occurred: ${err}`);
  }
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
