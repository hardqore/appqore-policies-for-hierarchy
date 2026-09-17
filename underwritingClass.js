export const parseUnderwritingClass = async (policy) => {

  if (policy.PRODUCT.toLowerCase() === "precoa") {
    if (
      policy.hdnAvailablePlans &&
      policy.hdnAvailablePlans.toLowerCase() === "annuity"
    )
      return "Z";

    if (
      isDownMulti(policy) ||
      (policy.hdnAvailablePlans &&
        policy.hdnAvailablePlans.toLowerCase() === "singlepay")
    ) {
      if (
        ["MT", "NH", "OR", "VT", "WA"].includes(
          policy.drpState.toUpperCase()
        ) &&
        policy.radTerminal &&
        policy.radTerminal.toLowerCase() === "yes"
      ) {
        return "B";
      } else {
        return "A";
      }
    }

    return parseUnderwritingClassOngoing(policy);
  } else if (policy.PRODUCT.toLowerCase() === "preneed") {
    if (policy.radAnnuity && policy.radAnnuity.toLowerCase() === "yes") {
      return "Z";
    }
    else {
      const underwritingConfig = await getConfig();
      return parsePreneedUnderwriting(underwritingConfig, policy);
    }
  } else {
    return "Z";
  }

};

export const parseUnderwritingClassOngoing = async (policy) => {
  if (policy.PRODUCT.toLowerCase() === "precoa") {
    if (
      policy.hdnAvailablePlans &&
      policy.hdnAvailablePlans.toLowerCase() === "annuity"
    )
      return "Z";

    if (
      policy.radHealthNC &&
      policy.radHealthNC.toLowerCase() === "yes"
    ) {
      return "B";
    } else if (
      ["MN", "TX", "VT", "OH"].includes(policy.drpState.toUpperCase())
    ) {
      if (
        policy.drpState.toUpperCase() === "MN" &&
        policy.radConfinedToBed &&
        policy.radConfinedToBed.toLowerCase() === "no" &&
        policy.radStroke &&
        policy.radStroke.toLowerCase() === "no" &&
        policy.radCOPD &&
        policy.radCOPD.toLowerCase() === "no"
      )
        return "A";
      else if (
        policy.drpState.toUpperCase() === "TX" &&
        policy.radHealthQuestions &&
        policy.radHealthQuestions.toLowerCase() === "no" &&
        policy.radHIV &&
        policy.radHIV.toLowerCase() === "no"
      )
        return "A";
      else if (
        policy.drpState.toUpperCase() === "VT" &&
        policy.radHealthQuestions &&
        policy.radHealthQuestions.toLowerCase() === "no" &&
        policy.radAIDSVT &&
        policy.radAIDSVT.toLowerCase() === "no"
      )
        return "A";
      else if (
        policy.drpState.toUpperCase() === "OH" &&
        policy.radHealthQuestions &&
        policy.radHealthQuestions.toLowerCase() === "no" &&
        policy.radHivOH &&
        policy.radHivOH.toLowerCase() === "no"
      )
        return "A";
      else return "B";
    } else if (
      (policy.radHealthQuestions &&
        policy.radHealthQuestions.toLowerCase() === "no") ||
      (policy.radHealthQuestionsMA &&
        policy.radHealthQuestionsMA.toLowerCase() === "no") ||
      (policy.radHealthQuestionsWI &&
        policy.radHealthQuestionsWI.toLowerCase() === "no") ||
      (policy.radHealthQuestionsFlMD &&
        policy.radHealthQuestionsFlMD.toLowerCase() === "no") ||
      (policy.radSecondHealth &&
        policy.radSecondHealth.toLowerCase() === "no")
    ) {
      return "A";
    } else {
      return "B";
    }
  }

  return "Z";
};

export const isDownMulti = (policy) => policy.hdnDownPaymentFlag && policy.hdnDownPaymentFlag !== 0;

function parsePreneedUnderwriting(underwritingConfig, appqoreJson) {

  const state = appqoreJson.drpState;
  const product = appqoreJson.drpProduct;
  const healthQuestionsConfig = underwritingConfig.HealthQuestionsConfiguration;
  const relevantQuestions = healthQuestionsConfig.filter((hq) => hq.State === state && hq.Product === product);
  const productUnderwritingClasses = underwritingConfig.ProductConfigurations.find(config => config.Product === product);
  if (appqoreJson.drpAvailablePlans.toLowerCase() === "single") {
    //TODO: MI specific logic. Anti pattern to the UW config - check against special case first
    if (state === "MI" && product === "2735PN") {
      if ((appqoreJson.radSohBase) && appqoreJson.radSohBase.toLowerCase() === "no") {
        return "A"
      }
      else {
        return "B"
      }
    }
    //DS-1212 (DS-1147 refactor/adjustment). Business requested we rid class B from these products. Rather than call the config, set them here.
    if (product === "2735PN" || "2735PNNC" || "3100PN" || "331514PNS" || "3315PN") {
      return "A"
    }
  }
  if (!productUnderwritingClasses) throw new Error(`Product: ${product} does not have a defined underwriting configuration`);
    for (let i = 0; i < relevantQuestions.length; ++i) {
    const hqField = relevantQuestions[i].FieldName;
    const hqResult = parseHealthQuestion(appqoreJson, hqField);
    if (!hqResult) {
      return "B";
    }
  }
  return "A";
}

function parseHealthQuestion(appqoreJson, fieldName) {
  const fieldValue = appqoreJson[fieldName];
  return fieldValue && fieldValue.toLowerCase() === "no";
}

export async function getConfig(){

  const data = {
    "HealthQuestionsConfiguration": [
      {
        "State": "AK",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AK",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "AK",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AK",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AK",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AK",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AK",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AK",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AK",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AL",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AL",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AL",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AR",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AR",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "AR",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "AR",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "AR",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AR",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AR",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "AR",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AR",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AR",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AR",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AR",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AR",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AR",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AZ",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AZ",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "AZ",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "AZ",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "AZ",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AZ",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AZ",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "AZ",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "AZ",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AZ",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AZ",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "AZ",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "AZ",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "AZ",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CA",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "CA",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "CA",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "CA",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CA",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CA",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "CA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CO",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CO",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CO",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CO",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CO",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CO",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CO",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CT",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CT",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CT",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "CT",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "CT",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "CT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "CT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "DC",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DC",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DC",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "DC",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DC",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "DC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "DC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "DC",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "DC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "DC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "DE",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DE",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DE",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "DE",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "DE",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "DE",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "DE",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "DE",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "DE",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "DE",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "FL",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "2735PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "2735PNNC",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "FL",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "FL",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "FL",
        "Product": "2790PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "2800PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "3100PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "331514PNS",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "FL",
        "Product": "3315PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "4400PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "FL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "FL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "FL",
        "Product": "4470PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "FL",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "FL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "FL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "GA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "GA",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "GA",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "GA",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "GA",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "GA",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "GA",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "GA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "GA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "GA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "GA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "GA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "GA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "GA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "HI",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "HI",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "HI",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "HI",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "HI",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "HI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "HI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "HI",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "HI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "HI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "ID",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "ID",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "ID",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "ID",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "ID",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "ID",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IL",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IL",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IL",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IL",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IL",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IN",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "IN",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "IN",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "IN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "IN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "KS",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KS",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "KS",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "KS",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "KS",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "KS",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KS",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "KS",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KS",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "KS",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "KS",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "KS",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "KS",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "KS",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "KY",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "KY",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "KY",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "KY",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "KY",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "KY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "KY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "LA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "LA",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "LA",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "LA",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "LA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "LA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "LA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "LA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "LA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "LA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "LA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MA",
        "Product": "2735PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "MA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MA",
        "Product": "3315PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "MA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MA",
        "Product": "4400PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "MA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MD",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MD",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "MD",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "MD",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "MD",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MD",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MD",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "MD",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MD",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MD",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MD",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MD",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MD",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MD",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "ME",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "ME",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "ME",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MI",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MI",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "MN",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "MN",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "MN",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "MN",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "MN",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "MN",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "MN",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MN",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MO",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "MO",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "MO",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "MO",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MO",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MO",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MO",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MO",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MO",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MO",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MS",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MS",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MS",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MS",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "MS",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MS",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MS",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MS",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MS",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MS",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MS",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MT",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MT",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "MT",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "MT",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "MT",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "MT",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "MT",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "MT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "MT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NC",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NC",
        "Product": "2735PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "NC",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "NC",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "NC",
        "Product": "2790PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NC",
        "Product": "2800PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NC",
        "Product": "3100PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "NC",
        "Product": "331514PNS",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NC",
        "Product": "3315PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NC",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NC",
        "Product": "4470PN",
        "FieldName": "radQuesNC"
      },
      {
        "State": "NC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "ND",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "ND",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "ND",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "ND",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "ND",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "ND",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "ND",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "ND",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "ND",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "ND",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "ND",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "ND",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "ND",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NE",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NE",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "NE",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "NE",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "NE",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NE",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "NE",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NE",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NE",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NE",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NE",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NE",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NE",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NH",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NH",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "NH",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NH",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NH",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NH",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NH",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NH",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NH",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NJ",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NJ",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "NJ",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "NJ",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "NJ",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NJ",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NJ",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NM",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NM",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NM",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NM",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "NM",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NM",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NM",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NM",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NM",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NM",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NM",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NV",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NV",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NV",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "NV",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "NV",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NV",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NV",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NV",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NV",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NV",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "NY",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "NY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "NY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OH",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "2735PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "2735PNNC",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "2800PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "2875PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "3100PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "331514PNS",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OH",
        "Product": "3315PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OH",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OH",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OH",
        "Product": "4400PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OH",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OH",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OH",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OH",
        "Product": "4470PN",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "OK",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OK",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OK",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OK",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "OK",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OK",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OK",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OK",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OK",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OK",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OK",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OR",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OR",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "OR",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "OR",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OR",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OR",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "OR",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "OR",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "OR",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "2735PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "PA",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "PA",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "PA",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "2800PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "2875PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "2875PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "2875PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "3100PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "3100PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "3100PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "331514PNS",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestionThree"
      },
      {
        "State": "PA",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "3315PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "PA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "PA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "PA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "PA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "RI",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "RI",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "RI",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "RI",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "RI",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "RI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "RI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "RI",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "RI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "RI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "SC",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SC",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "SC",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "SC",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "SC",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SC",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SC",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "SC",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SC",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "SC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "SC",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "SC",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "SC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "SC",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "SD",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SD",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "SD",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "SD",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "SD",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SD",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "SD",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "SD",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "SD",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "SD",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "SD",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "SD",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "SD",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "TN",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TN",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TN",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TN",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "TN",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TN",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "TN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "TN",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "TN",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "TN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "TN",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "TX",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TX",
        "Product": "2735PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TX",
        "Product": "2800PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TX",
        "Product": "3100PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "TX",
        "Product": "331514PNS",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "TX",
        "Product": "3315PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "4400PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "TX",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "TX",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "TX",
        "Product": "4470PN",
        "FieldName": "colSohFLTX"
      },
      {
        "State": "TX",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "TX",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "TX",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "UT",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "UT",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "UT",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "UT",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "UT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "UT",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "UT",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "UT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "UT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "VA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "VA",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "VA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "VA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "VA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "VT",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "VT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "VT",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WA",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WA",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "WA",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WA",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WA",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WI",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WI",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "WI",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "WI",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "WI",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "WI",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WI",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "WI",
        "Product": "331514PNS",
        "FieldName": "radSohOHQuestion"
      },
      {
        "State": "WI",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WI",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WI",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WI",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WI",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WV",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "2875PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "3100PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WV",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WV",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WV",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WV",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WV",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WV",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WY",
        "Product": "2735PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WY",
        "Product": "2735PNNC",
        "FieldName": "radSohBase"
      },
      {
        "State": "WY",
        "Product": "2790PN",
        "FieldName": "colBaseColumns2RadioField"
      },
      {
        "State": "WY",
        "Product": "2790PN",
        "FieldName": "colBaseColumnsRadioField"
      },
      {
        "State": "WY",
        "Product": "2790PN",
        "FieldName": "colBaseRadioField"
      },
      {
        "State": "WY",
        "Product": "2800PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WY",
        "Product": "331514PNS",
        "FieldName": "radSohBase"
      },
      {
        "State": "WY",
        "Product": "3315PN",
        "FieldName": "radSohBase"
      },
      {
        "State": "WY",
        "Product": "4400PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WY",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WY",
        "Product": "4400PN",
        "FieldName": "radSohMNPAQuestionTwo"
      },
      {
        "State": "WY",
        "Product": "4470PN",
        "FieldName": "colSohSeriesTwenty"
      },
      {
        "State": "WY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestion"
      },
      {
        "State": "WY",
        "Product": "4470PN",
        "FieldName": "radSohMNPAQuestionTwo"
      }
    ],
    "ProductConfigurations": [
      {
        "Product": "2735PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "A"
      },
      {
        "Product": "2735PNNC",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "A"
      },
      {
        "Product": "2790PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "B"
      },
      {
        "Product": "2800PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "B"
      },
      {
        "Product": "2815PN",
        "PreferredUnderwritingClass": "B",
        "StandardUnderwritingClass": "B"
      },
      {
        "Product": "2875PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "B"
      },
      {
        "Product": "3100PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "A"
      },
      {
        "Product": "331514PNS",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "A"
      },
      {
        "Product": "3315PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "A"
      },
      {
        "Product": "4400PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "B"
      },
      {
        "Product": "4470PN",
        "PreferredUnderwritingClass": "A",
        "StandardUnderwritingClass": "B"
      }
    ]
  }

  return Object.freeze(data);
}