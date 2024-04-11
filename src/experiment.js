/**
 * @title Where's the coin?
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
  bucketHTML,
  formatFeedback,
  messageConditionTimes,
  nTrialsByCondition,
  bucketsByCondition,
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
import { sampleBucket, renderMessage } from "./utils";
import { range } from "./utils";
import { proliferate } from "./proliferate";
import ElicitDistributionPlugin from "./elicit-distribution";

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
  const nTrials = nTrialsByCondition[condition];
  const buckets = bucketsByCondition[condition].buckets;
  const bucketProbs = bucketsByCondition[condition].probs;
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
            chain = c;
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
            chain = c;
          }
        });
      }
    },
  });

  if (receiveMessage == 1) {
    timeline.push({
      type: HtmlButtonResponse,
      stimulus: () => {
        return chain == null
          ? "Loading...."
          : chain.messages.length == 0
          ? "You are the first participant in your chain, so there is not a message for you to read."
          : renderMessage(chain.messages[chain.messages.length - 1]);
      },
      data: () => {
        return {
          phase: "readMessage",
          chainId: chain._id,
          messageReceived: chain.messages[chain.messages.length - 1],
        };
      },
      choices: ["Continue"],
      on_finish: () => {
        if (writeMessage == 0) {
          updateReads(chain._id);
        }
      },
    });
  }

  if (doLearning == 1) {
    timeline.push({
      type: HtmlButtonResponse,
      stimulus: `<p>You will now start the learning trials. Press "continue" to begin.</p>`,
      choices: ["Continue"],
    });

    const learningStages = [
      {
        type: HtmlButtonResponse,
        stimulus: "Click the bucket where you think the coin is",
        choices: buckets,
        data: function () {
          return {
            correctBucket: jsPsych.timelineVariable("correctBucket"),
            phase: "learning",
          };
        },
        button_html: bucketHTML,
      },
      {
        type: HtmlButtonResponse,
        stimulus: function () {
          const lastTrial = jsPsych.data.get().last(1).values()[0];
          const lastCorrectBucket = lastTrial["correctBucket"];
          const lastTrialCorrect =
            buckets[parseInt(lastTrial["response"])] == lastCorrectBucket;
          return formatFeedback(lastCorrectBucket, lastTrialCorrect, buckets);
        },
        choices: ["Continue"],
      },
    ];

    const learningTimeline = {
      timeline: learningStages,
      timeline_variables: range(nTrials).map((i) => {
        return {
          correctBucket: sampleBucket(buckets, bucketProbs),
        };
      }),
      randomize_order: true,
    };

    timeline.push(learningTimeline);
  }

  if (writeMessage == 1) {
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
        sendMessage(chain._id, data.response.message);
      },
      data: { phase: "writeMessage" },
    };
    timeline.push(writeMessageTrial);
  }

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
  timeline.push(postExperimentSurvey);

  await jsPsych.run(timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  // return jsPsych;
}
