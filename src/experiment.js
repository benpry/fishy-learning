/**
 * @title Fish Survey
 * @description A learning experiment for humans
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import InstructionsPlugin from "@jspsych/plugin-instructions";
import HtmlButtonResponse from "@jspsych/plugin-html-button-response";
import HtmlSurveyText from "./survey-text-timed";
import { initJsPsych } from "jspsych";
import {
  getInstructionPages,
  fishHTML,
  formatFeedback,
  messageConditionTimes,
  nTrialsByCondition,
  fishesByCondition,
  consentText,
  testPhaseInstructions,
  getWriteMessageInstructions,
} from "./constants";
import {
  assignToChain,
  freeChain,
  assignToChainNoBusy,
  sendMessage,
  updateReads,
} from "./api";
import { startTimer } from "./timer";
import { sampleFish, renderMessage } from "./utils";
import { range } from "./utils";
import { proliferate } from "./proliferate";
import ElicitDistributionPlugin from "./elicit-distribution";

function getInitialTrials(
  assetPaths,
  writeMessage,
  messageCondition,
  messageWritingTime,
  chainHolder,
  jsPsych,
) {
  const timeline = [];

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.instructions,
  });

  timeline.push({
    type: HtmlButtonResponse,
    stimulus: consentText,
    choices: ["I agree"],
  });

  timeline.push({
    type: InstructionsPlugin,
    pages: getInstructionPages(writeMessage, messageWritingTime),
    show_clickable_nav: true,
    on_load: () => {
      if (writeMessage == 1) {
        assignToChain(messageCondition).then((c) => {
          if (c == 404) {
            jsPsych.endExperiment(
              "Unfortunately there is no space in the experiment at this time. We apologize for the inconvenience.",
              { failed: true, failedReason: "noFreeChains" },
            );
          } else {
            chainHolder.item = c;
          }
        });
      } else {
        assignToChainNoBusy(messageCondition).then((c) => {
          if (c == 404) {
            jsPsych.endExperiment(
              "Unfortunately there is no space in the experiment at this time. We apologize for the inconvenience.",
              { failed: true, failedReason: "noFreeChains" },
            );
          } else {
            chainHolder.item = c;
          }
        });
      }
    },
  });

  return timeline;
}

function getReceiveMessageTrial(writeMessage, jsPsych, chainHolder) {
  return {
    type: HtmlButtonResponse,
    stimulus: () => {
      const chain = chainHolder.item;
      return chain == null
        ? "Loading...."
        : chain.messages.length == 0
        ? "You are the first participant in your chain, so there is not a message for you to read."
        : renderMessage(chain.messages[chain.messages.length - 1]);
    },
    data: () => {
      const chain = chainHolder.item;
      return {
        phase: "readMessage",
        chainId: chain._id,
        messageReceived: chain.messages[chain.messages.length - 1],
      };
    },
    choices: ["Continue"],
    on_finish: () => {
      const chain = chainHolder.item;
      if (writeMessage == 0) {
        updateReads(chain._id);
      }
    },
  };
}

function getLearningTrials(condition, jsPsych) {
  const fishes = fishesByCondition[condition].fishes;
  const nTrials = nTrialsByCondition[condition];
  const fishProbs = fishesByCondition[condition].probs;

  const timeline = [];

  timeline.push({
    type: HtmlButtonResponse,
    stimulus: `<p>You will now start the learning trials. Press "continue" to begin.</p>`,
    choices: ["Continue"],
  });

  const learningStages = [
    {
      type: HtmlButtonResponse,
      stimulus: "Click the fish where you think the coin is",
      choices: fishes,
      data: function () {
        return {
          correctFish: jsPsych.timelineVariable("correctFish"),
          phase: "learning",
        };
      },
      button_html: fishHTML,
    },
    {
      type: HtmlButtonResponse,
      stimulus: function () {
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        const lastCorrectFish = lastTrial["correctFish"];
        const lastTrialCorrect =
          fishes[parseInt(lastTrial["response"])] == lastCorrectFish;
        return formatFeedback(lastCorrectFish, lastTrialCorrect, fishes);
      },
      choices: ["Continue"],
    },
  ];

  const learningTimeline = {
    timeline: learningStages,
    timeline_variables: range(nTrials).map((i) => {
      return {
        correctFish: sampleFish(fishes, fishProbs),
      };
    }),
    randomize_order: true,
  };

  timeline.push(learningTimeline);
  return timeline;
}

function getWriteMessageTrials(messageWritingTime, chainHolder) {
  const timeline = [];
  const writeMessageInstructions = {
    type: HtmlButtonResponse,
    stimulus: getWriteMessageInstructions(messageWritingTime),
    choices: [],
    trial_duration: 5000,
  };
  const writeMessageTrial = {
    type: HtmlSurveyText,
    questions: [
      {
        prompt: "Please write a message to help the next participant.",
        placeholder: "Type your message here",
        name: "message",
        rows: 8,
        columns: 60,
      },
    ],
    trial_duration: messageWritingTime * 1000,
    on_finish: function (data) {
      const chain = chainHolder.item;
      sendMessage(chain._id, data.response.message);
    },
    data: { phase: "writeMessage" },
  };
  timeline.push(writeMessageTrial);

  return timeline;
}

function getTestTrials(condition) {
  const timeline = [];

  timeline.push({
    type: HtmlButtonResponse,
    stimulus: testPhaseInstructions,
    choices: ["Begin"],
  });

  // add dependent measure
  timeline.push({
    type: ElicitDistributionPlugin,
    condition: condition,
    data: { phase: "test" },
  });

  return timeline;
}

function getPostExperimentSurvey() {
  const postExperimentSurvey = {
    type: HtmlSurveyText,
    preamble:
      "<p>Thank you for taking part in the experiment.</p><p>You will be redirected to Prolific after this survey. Please do not navigate away from this page.</p>",
    questions: [
      {
        prompt:
          "Please describe the strategy you used to answer the questions in this experiment.",
        rows: 6,
        columns: 50,
        name: "strategy",
      },
      {
        prompt: "Were any of the instructions unclear?",
        rows: 6,
        columns: 50,
        name: "instructions",
      },
      {
        prompt:
          "Please give any feedback you have about the experiment, including problems encountered.",
        rows: 6,
        columns: 50,
        name: "feedback",
      },
    ],
  };
  return postExperimentSurvey;
}

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({
  assetPaths,
  input = {},
  environment,
  title,
  version,
}) {
  // Chains to assign participants to
  let chain = null;
  const chainHolder = { item: chain };

  const jsPsych = initJsPsych({
    on_finish: function (data) {
      if (!data.last(1).values()[0].failed) {
        proliferate.submit({
          trials: data.values(),
        });
      }
    },
    on_close: () => {
      if (chain != null) {
        if (chain.busy) {
          freeChain(chain._id);
        }
      }
    },
  });

  const condition = jsPsych.data.getURLVariable("condition");
  const messageCondition = jsPsych.data.getURLVariable("mC");
  const messageWritingTime = messageConditionTimes[messageCondition];
  const doLearning = jsPsych.data.getURLVariable("doL");
  const receiveMessage = jsPsych.data.getURLVariable("recM");
  const writeMessage = jsPsych.data.getURLVariable("wM");
  const timeline = [];

  // add the initial trials
  timeline.push(
    ...getInitialTrials(
      assetPaths,
      writeMessage,
      messageCondition,
      messageWritingTime,
      chainHolder,
      jsPsych,
    ),
  );

  // add receive message tiral
  if (receiveMessage == 1) {
    timeline.push(getReceiveMessageTrial(writeMessage, jsPsych, chainHolder));
  }

  // add the learning trials
  if (doLearning == 1) {
    timeline.push(...getLearningTrials(condition, jsPsych));
  }

  // add the message writing trials
  if (writeMessage == 1) {
    timeline.push(...getWriteMessageTrials(messageWritingTime, chainHolder));
  }

  // add the test trials
  timeline.push(...getTestTrials(condition));

  timeline.push(getPostExperimentSurvey());

  await jsPsych.run(timeline);
}
