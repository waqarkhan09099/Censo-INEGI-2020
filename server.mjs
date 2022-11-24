import express from "express";
import {
  municiPolygonDataAPI,
  municipalitiesCatalog,
  stateCatalog,
  statePolygonDataAPI,
} from "./apiLinks.mjs";
import Alexa, { SkillBuilders } from "ask-sdk-core";
import morgan from "morgan";
import { ExpressAdapter } from "ask-sdk-express-adapter";
import axios from "axios";

const app = express();
app.use(morgan("dev"));
const PORT = process.env.PORT || 3000;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    const speakOutput =
      "Bienvenido Censo INEGI 2020, por favor dígame qué información de población de la ciudad le gusta escuchar.";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .withSimpleCard(
        "Bienvenido Censo INEGI 2020, por favor dígame qué información de población de la ciudad le gusta escuchar."
      )
      .getResponse();
  },
};

const MunicipalitiesIntent = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "MunicipalitiesIntent"
    );
  },
  async handle(handlerInput) {
    const slots = handlerInput?.requestEnvelope?.request?.intent?.slots;

    const municipalities = slots?.municipality?.value;

    // find give slot is match on catalog
    console.log(municipalities);
    if (municipalities) {
      const municipalitiesData = await axios(municipalitiesCatalog);
      console.log(municipalitiesData);
      const muniIndex = municipalitiesData.data.features.findIndex(
        (item) => item.properties.nomgeo == municipalities.trim()
      );
      console.log(muniIndex);

      let res = "";
      if (muniIndex === -1) {
        return handlerInput.responseBuilder
          .speak(`Your given municipalities data not found`)
          .reprompt(`Your given municipalities data not found`)
          .withSimpleCard(`Your given municipalities data not found`)
          .getResponse();
      } else if (muniIndex >= 0) {
        const cve_munc =
          municipalitiesData.data.features[muniIndex].properties.cvegeo;
        res = await axios.get(
          `https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Acpv2020_municipios&maxFeatures=50&outputFormat=application%2Fjson&CQL_FILTER=cve_munc=${cve_munc}`
        );
        console.log(cve_munc);
        if (res.data?.features.length > 0 && res.data) {
          const data = {
            pop_tot: res.data?.features[0]?.properties?.pob_tot,
            nom_ent: res.data?.features[0]?.properties?.nom_ent,
            cve_munc: res.data?.features[0]?.properties?.cve_munc,
            nomgeo: res.data?.features[0]?.properties?.nomgeo,
          };
          return handlerInput.responseBuilder
            .speak(`Population of ${data?.nomgeo} is ${data?.pop_tot}`)
            .reprompt(`Population of ${data?.nomgeo} is ${data?.pop_tot}`)
            .withSimpleCard(`Population of ${data?.nomgeo} is ${data?.pop_tot}`)
            .getResponse();
        } else {
          return handlerInput.responseBuilder
            .speak(`Data not founded`)
            .reprompt(`Data not founded`)
            .withSimpleCard(`Data not founded`)
            .getResponse();
        }
      }
    } else {
      console.log("check slot value is not valid");
      return handlerInput.responseBuilder
        .speak(`please tell me municipality name`)
        .reprompt(`please tell me municipality name`)
        .getResponse();
    }
  },
};
const StateIntent = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "StateIntent"
    );
  },
  async handle(handlerInput) {
    // its a dummy audio sound
    // "nom_ent":"México","cve_munc":"15022","nomgeo":"Cocotitlán"
    const slots = handlerInput?.requestEnvelope?.request?.intent?.slots;

    const state = slots?.state?.value;

    const stateData = await axios(stateCatalog);
    console.log("state Data-->", stateData.features);

    const res = await axios.get(
      state
        ? `https://layers.carto.zone/geoserver/demo_cartozone/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=demo_cartozone%3Acpv2020_estados&maxFeatures=50&outputFormat=application%2Fjson&CQL_FILTER=cveent=${state}`
        : statePolygonDataAPI
    );
    // console.log(res.data);
    const data = {
      pop_tot: res?.data?.features[0].properties?.pob_tot,
      nom_ent: res?.data?.features[0].properties?.nom_ent,
      cve_munc: res?.data?.features[0].properties?.cve_munc,
      nomgeo: res?.data?.features[0].properties?.nomgeo,
    };
    return handlerInput.responseBuilder
      .speak(`Population of ${data.nomgeo} is ${data.pop_tot}`)
      .reprompt(`Population of ${data.nomgeo} is ${data.pop_tot}`)
      .withSimpleCard(`Population of ${data.nomgeo} is ${data.pop_tot}`)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput =
      "You can tell me for listen cat sounds! How can I help?";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = "Goodbye!";

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "Sorry, I don't know about that. Please try again.";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    console.log(
      `~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
  },
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents
 * by defining them above, then also adding them to the request handler chain below
 * */
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below
 * */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput =
      "Sorry, I had trouble doing what you asked. Please try again.";
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};
// ..............................Menu Intents .........................

///////////////////////////////////END////////////////////////////////////////////////

const skillBuilder = SkillBuilders.custom()
  .addRequestHandlers(
    MunicipalitiesIntent,
    StateIntent,
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  )
  .addErrorHandlers(ErrorHandler);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post("/api/v1/webhook-alexa", adapter.getRequestHandlers());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Censo INEGI 2022 Voice App");
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
