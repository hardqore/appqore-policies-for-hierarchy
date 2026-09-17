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
        `${baseUrl}/workflows/${workflowId}/submissions?filter=created>2024-01-01T00:00:00Z&offset=${offset}&limit=${PAGE_SIZE}&dataFields=numPolicynumber,drpProductPrecoa,PRODUCT,hdnProductCode,hdnPayPeriod,drpState,agentCompanyProducerID,dateDateofBirth,appStatus,drpPaymentTypeInitial,drpAvailablePlans,radTerminal,radHealthNC,radConfinedToBed,radStroke,radCOPD,radHealthQuestions,radHIV,radAIDSVT,radHivOH,radHealthQuestionsMA,radHealthQuestionsWI,radHealthQuestionsFlMD,radSecondHealth`,
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

    if (policies[policy].drpPaymentTypeInitial) {
      policies[policy].isCC =
        policies[policy].drpPaymentTypeInitial.toLowerCase() === "cc" ||
        policies[policy].drpPaymentTypeInitial.toLowerCase() === "creditcard";
    } else {
      policies[policy].isCC = false;
    }

    let isSinglePay =
      policies[policy].drpAvailablePlans &&
      policies[policy].drpAvailablePlans.toLowerCase() === "single";
    const payPeriod = parseInt(policies[policy].hdnPayPeriod ?? 0);

    const underwritingClass = await parseUnderwritingClass(policies[policy]);

    results.push({
      numPolicynumber: policies[policy].numPolicynumber,
      producer: policies[policy].agentCompanyProducerID,
      state: policies[policy].drpState,
      plan: policies[policy].drpProductPrecoa,
      age: policies[policy].age,
      class: underwritingClass,
      isCC: policies[policy].isCC,
      payPeriod: getID3PayPeriod(underwritingClass, isSinglePay, payPeriod),
    });
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
    const baseUrl = `${environment.url}/api/1.0`;
    const authToken = await getAuthToken(
      `${baseUrl}/oauth2/access_token`,
      environment.username,
      options.password
    );

    const policiesFromAppQore = await getPoliciesFromAppQore(
      baseUrl,
      PRECOA_WORKFLOW_ID,
      authToken
    );

    const policies = await parseAppQorePolicies(policiesFromAppQore);

    let results = [];

    let missingProducerId = [];
    let missingHierarchy = 0;
    let policyWithMissingHierarchy = [];

    for (const policy in policies) {
      let axiosResult;
      const queryString = `producer=${policies[policy].producer}&plan=${policies[policy].plan}&state=${policies[policy].state}&age=${policies[policy].age}&class=${policies[policy].class}&&isCC=${policies[policy].isCC}&payPeriod=${policies[policy].payPeriod}`;

      try {
        axiosResult = await getHierarchyData(queryString, options.apiKey);

        if (!axiosResult) {
          missingHierarchy++;
        }

        if (
          !axiosResult &&
          !missingProducerId.includes(policies[policy].producer)
        ) {
          missingProducerId.push(policies[policy].producer);
        }
        if (
          !axiosResult &&
          !policyWithMissingHierarchy.includes(policies[policy].numPolicynumber)
        ) {
          policyWithMissingHierarchy.push(policies[policy].numPolicynumber);
        }

        const sql = `select hierarchyid as "hierarchy", productlinecode as "productLineCode", plancode as "planCode", growthrate::numeric as "growthRate", mnemonicplancode as "mnemonic", ridermnemonicplancode as "riderMnemonic", riderbenefittype as "riderBenefitType", coalesce(funeralhomepin, '') as "funeralHomePinId" from view_materialized_hierarchy where producerID IN ('${
          policies[policy].producer
        }') and stateprovinceid = '${
          policies[policy].state
        }' and hierarchyid = '${policies[
          policy
        ].plan.toUpperCase()}' and paymentscheduleindicator = '${
          policies[policy].payPeriod
        }' and underwritingclass = '${
          policies[policy].class
        }' and iscc = false;`;
        results.push({
          queryString: queryString,
          policyNumber: policies[policy].numPolicynumber,
          producerId: policies[policy].producer,
          plan: policies[policy].plan,
          state: policies[policy].state,
          age: policies[policy].age,
          uwClass: policies[policy].class,
          isCC: policies[policy].isCC,
          payPeriod: policies[policy].payPeriod,
          funeralHomePinId: "",
          growthRate: "",
          hierarchyPlanDataValues: axiosResult,
          sqlQuery: sql,
        });

        console.info(
          JSON.stringify(
            {
              queryString: queryString,
              policyNumber: policies[policy].numPolicynumber,
              producerId: policies[policy].producer,
              plan: policies[policy].plan,
              state: policies[policy].state,
              age: policies[policy].age,
              uwClass: policies[policy].class,
              isCC: policies[policy].isCC,
              payPeriod: policies[policy].payPeriod,
              funeralHomePinId: "",
              growthRate: "",
              hierarchyPlanDataValues: axiosResult,
            },
            null,
            2
          )
        );
      } catch (err) {
        console.log(err);
      }
    }

    fs.writeFileSync(
      `hierarchy-data-for-postman-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}.json`,
      JSON.stringify(results, null, 2)
    );

    fs.writeFileSync(
      `missing-producerid-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${policies.length}-${missingProducerId.length}.txt`,
      JSON.stringify(missingProducerId)
    );

    fs.writeFileSync(
      `missing-policies-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${policies.length}-${
        policyWithMissingHierarchy.length
      }.txt`,
      JSON.stringify(policyWithMissingHierarchy)
    );
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
    .catch((err) => {
      console.log(err);
    });
};

(async () => {
  console.log("Processing...");
  await main();
  console.log("DONE");
})();
