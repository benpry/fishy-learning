/**
 * @title Fishing
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
import SurveyMultiChoice from "@jspsych/plugin-survey-multi-choice";
import HtmlSurveyText from "./survey-text-timed";
import { initJsPsych } from "jspsych";
import {
  getInstructionPages,
  fishHTML,
  fishingRodHTML,
  formatCaughtFish,
  messageConditionTimes,
  nTrialsByCondition,
  fishesByCondition,
  consentText,
  testPhaseInstructions,
  getWriteMessageInstructions,
  getBlockHeaderHTML,
} from "./constants";
import {
  assignToChain,
  freeChain,
  assignToChainNoBusy,
  sendMessage,
  updateReads,
} from "./api";
import { startTimer } from "./timer";
import { shuffle, sampleFish, renderMessage } from "./utils";
import { range } from "./utils";
import { proliferate } from "./proliferate";
import ElicitDistributionPlugin from "./elicit-distribution";

const handleChainAssignment = () => {
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
  } else if (receiveMessage == 1) {
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
};

function getInitialTrials(
  assetPaths,
  writeMessage,
  receiveMessage,
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

  const instructions = {
    type: InstructionsPlugin,
    pages: getInstructionPages(
      writeMessage,
      receiveMessage,
      messageWritingTime,
    ),
    show_clickable_nav: true,
  };

  const qs = [
    {
      prompt: "All of the lakes have different proportions of fish",
      name: "proportions",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt: "Your goal is only to identify the most common type of fish",
      name: "goal",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt: "When you catch a fish, it is permanently removed from the lake",
      name: "replacement",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt:
        "Your bonus will depend on how accurately you predicted the proportions of fish",
      name: "accuracy",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt:
        "The more confident you are in your predictions, the higher your bonus",
      name: "confidence",
      options: ["true", "false"],
      required: true,
    },
  ];

  const correctAnswers = {
    proportions: "true",
    goal: "false",
    replacement: "false",
    accuracy: "true",
    confidence: "true",
  };

  const comprehensionCheck = {
    type: SurveyMultiChoice,
    preamble:
      "Please answer the following questions before you begin the experiment.",
    questions: qs,
    data: { task: "comprehension-check" },
  };

  const comprehensionCheckFail = {
    timeline: [
      {
        type: HtmlButtonResponse,
        stimulus: `<p class="instructions-text">It seems like you did not answer all of the questions correctly. Please read the instructions carefully and try again.</p>`,
        choices: ["Continue"],
      },
    ],
    conditional_function: function (data) {
      const responses = jsPsych.data
        .get()
        .filter({ task: "comprehension-check" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(correctAnswers).every(([key, value]) => {
        return responses[key] === value;
      });
      return correct ? false : true;
    },
  };

  const comprehensionCheckPass = {
    timeline: [
      {
        type: HtmlButtonResponse,
        stimulus: `<p class="instructions-text">You answered all the questions correctly! Press 'Continue' to move on to the practice round.</p>`,
        choices: ["Continue"],
      },
    ],
    conditional_function: function (data) {
      const responses = jsPsych.data
        .get()
        .filter({ task: "comprehension-check" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(correctAnswers).every(([key, value]) => {
        return responses[key] === value;
      });
      return correct;
    },
  };

  const instructionsLoop = {
    timeline: [
      instructions,
      comprehensionCheck,
      comprehensionCheckFail,
      comprehensionCheckPass,
    ],
    loop_function: function (data) {
      const responses = jsPsych.data
        .get()
        .filter({ task: "comprehension-check" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(correctAnswers).every(([key, value]) => {
        return responses[key] === value;
      });
      return correct ? false : true;
    },
  };

  timeline.push(instructionsLoop);

  return timeline;
}

function getBlockHeader(condition) {
  return {
    type: HtmlButtonResponse,
    stimulus: getBlockHeaderHTML(condition),
    choices: ["Continue"],
  };
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
    stimulus: `<p>You will now start the learning trials. Press 'Continue' to begin.</p>`,
    choices: ["Continue"],
  });

  const learningStages = [
    {
      type: HtmlButtonResponse,
      stimulus: "Click the fishing rod to catch a fish",
      choices: ["fish"],
      data: function () {
        return {
          phase: "learning",
        };
      },
      button_html: fishingRodHTML,
    },
    {
      type: HtmlButtonResponse,
      stimulus: function () {
        const caughtFish = jsPsych.timelineVariable("fishCaught");
        return formatCaughtFish(caughtFish);
      },
      choices: ["Continue"],
    },
  ];

  const learningTimeline = {
    timeline: learningStages,
    timeline_variables: range(nTrials).map((i) => {
      return {
        fishCaught: sampleFish(fishes, fishProbs),
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

function getPracticeRound(doLearning, writeMessage, receiveMessage, jsPsych) {
  const practiceTimeline = [];

  practiceTimeline.push({
    type: HtmlButtonResponse,
    stimulus: `<p class="instructions-text">This is a practice round for you to complete before you begin the main experiment.</p>`,
    choices: ["Continue"],
  });

  if (receiveMessage == 1) {
    practiceTimeline.push({
      type: HtmlButtonResponse,
      stimulus: renderMessage("This is a test message."),
      choices: ["Continue"],
    });
  }
  if (doLearning == 1) {
    practiceTimeline.push({
      type: HtmlButtonResponse,
      stimulus: `<p>You will now start the learning trials. Press "continue" to begin.</p>`,
      choices: ["Continue"],
    });

    const learningStages = [
      {
        type: HtmlButtonResponse,
        stimulus: "Click the fishing rod to catch a fish",
        choices: ["fish"],
        data: function () {
          return {
            phase: "learning",
          };
        },
        button_html: fishingRodHTML,
      },
      {
        type: HtmlButtonResponse,
        stimulus: function () {
          const caughtFish = jsPsych.timelineVariable("fishCaught");
          return formatCaughtFish(caughtFish);
        },
        choices: ["Continue"],
      },
    ];

    const learningTimeline = {
      timeline: learningStages,
      timeline_variables: ["red", "blue", "red", "red", "red"].map((f) => {
        return {
          fishCaught: f,
        };
      }),
      randomize_order: false,
    };
    practiceTimeline.push(learningTimeline);
  }

  practiceTimeline.push(...getTestTrials(-1));

  practiceTimeline.push({
    type: HtmlButtonResponse,
    stimulus: `<p>Great job! You have completed the practice round. Press 'Continue' to begin the main experiment.</p>`,
    choices: ["Continue"],
  });

  return practiceTimeline;
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

  const conditions = [0, 1, 2, 3];
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
      receiveMessage,
      messageCondition,
      messageWritingTime,
      chainHolder,
      jsPsych,
    ),
  );

  timeline.push(
    ...getPracticeRound(doLearning, writeMessage, receiveMessage, jsPsych),
  );

  shuffle(conditions);
  for (let condition of conditions) {
    let blockTimeline = [];

    blockTimeline.push(getBlockHeader(condition));

    // add receive message tiral
    if (receiveMessage == 1) {
      blockTimeline.push(
        getReceiveMessageTrial(writeMessage, jsPsych, chainHolder),
      );
    }

    // add the learning trials
    if (doLearning == 1) {
      blockTimeline.push(...getLearningTrials(condition, jsPsych));
    }

    // add the message writing trials
    if (writeMessage == 1) {
      blockTimeline.push(
        ...getWriteMessageTrials(messageWritingTime, chainHolder),
      );
    }

    // add the test trials
    blockTimeline.push(...getTestTrials(condition));

    timeline.push({
      timeline: blockTimeline,
      timeline_variables: [{ condition: condition }],
    });
  }

  timeline.push(getPostExperimentSurvey());

  await jsPsych.run(timeline);
}
