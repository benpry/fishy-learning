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
import HtmlSurveyText from "./survey-text-char-limit";
import { initJsPsych } from "jspsych";
import {
  getInstructionPages,
  fishHTML,
  fishingRodHTML,
  formatCaughtFish,
  messageConditionLimits,
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
import { shuffle, sampleFish, renderMessage, findHDI } from "./utils";
import { range } from "./utils";
import { proliferate } from "./proliferate";
import ElicitDistributionPlugin from "./elicit-distribution";
import ReadMessagePlugin from "./read-message";
import SendMessagePlugin from "./send-message";
import { jStat } from "jstat";

const handleChainAssignment = (
  stimulusCondition,
  receiveMessage,
  writeMessage,
  chainHolder,
) => {
  const conditionStr = `s${stimulusCondition}`;
  if (writeMessage == 1) {
    assignToChain(conditionStr).then((c) => {
      if (c == 404) {
        jsPsych.endExperiment(
          "Unfortunately there is no space in the experiment at this time. We apologize for the inconvenience.",
          { failed: true, failedReason: "noFreeChains" },
        );
      } else {
        chainHolder.item = c;
        const mC = parseInt(c.condition[c.condition.length - 1]);
        chainHolder.messageCondition = mC;
      }
      document.querySelectorAll("button").forEach((e) => {
        e.disabled = false;
      });
    });
  } else if (receiveMessage == 1) {
    assignToChainNoBusy(conditionStr).then((c) => {
      if (c == 404) {
        jsPsych.endExperiment(
          "Unfortunately there is no space in the experiment at this time. We apologize for the inconvenience.",
          { failed: true, failedReason: "noFreeChains" },
        );
      } else {
        chainHolder.item = c;
        const mC = parseInt(c.condition[c.condition.length - 1]);
        chainHolder.messageCondition = mC;
      }
      document.querySelectorAll("button").forEach((e) => {
        e.disabled = false;
      });
    });
  }
};

const practiceConditionNObs = [
  [3, 4],
  [5, 6],
  [7, 8],
];
const practiceStimulusConditions = ["-1", "-2", "-3"];
const practiceMessageConditionLimits = [1, 3, 5];

function getInitialTrials(
  assetPaths,
  doLearning,
  writeMessage,
  receiveMessage,
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
    pages: getInstructionPages(writeMessage, receiveMessage),
    show_clickable_nav: true,
  };

  const qs = [
    {
      prompt: "All of the ponds have different proportions of fish",
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
      prompt:
        "The higher you set the information value, the higher your potential bonus will be.",
      name: "confidence",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt:
        "Your bonus depends on how well the participants who receive your messages do on the task.",
      name: "message",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt: "When you catch a fish, it is permanently removed from the pond",
      name: "replacement",
      options: ["true", "false"],
      required: true,
    },
  ];

  // shuffle(qs);

  const correctAnswers = {
    proportions: "true",
    goal: "false",
    replacement: "false",
    confidence: "true",
    message: "true",
  };

  const comprehensionCheck = {
    type: SurveyMultiChoice,
    preamble:
      "Please answer the following questions before you begin the experiment.",
    questions: qs,
    data: { phase: "comprehensionCheck" },
  };

  const comprehensionCheckFail = {
    timeline: [
      {
        type: HtmlButtonResponse,
        stimulus: `<p class="instructions-text">You did not answer all of the questions correctly. Please read the instructions carefully and try again.</p>`,
        choices: ["Continue"],
      },
    ],
    conditional_function: function (data) {
      const responses = jsPsych.data
        .get()
        .filter({ phase: "comprehensionCheck" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(responses).every(([key, value]) => {
        return correctAnswers[key] === value;
      });
      return correct ? false : true;
    },
  };

  const comprehensionCheckPass = {
    timeline: [
      {
        type: HtmlButtonResponse,
        stimulus: `<p class="instructions-text">You answered all the questions correctly! Press 'Continue' to move on to the practice rounds.</p>`,
        choices: ["Continue"],
      },
    ],
    conditional_function: function (data) {
      const responses = jsPsych.data
        .get()
        .filter({ phase: "comprehensionCheck" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(responses).every(([key, value]) => {
        return correctAnswers[key] === value;
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
        .filter({ phase: "comprehensionCheck" })
        .last(1)
        .values()[0].response;
      const correct = Object.entries(responses).every(([key, value]) => {
        return correctAnswers[key] === value;
      });
      return correct ? false : true;
    },
  };

  timeline.push(instructionsLoop);

  return timeline;
}

function getBlockHeader(
  stimulusCondition,
  receiveMessage,
  writeMessage,
  chainHolder,
) {
  return {
    type: HtmlButtonResponse,
    stimulus: getBlockHeaderHTML(stimulusCondition),
    choices: ["Continue"],
    on_load: () => {
      document.querySelectorAll("button").forEach((e) => {
        e.disabled = true;
      });
      handleChainAssignment(
        stimulusCondition,
        receiveMessage,
        writeMessage,
        chainHolder,
      );
    },
  };
}

function getReceiveMessageTrial(
  writeMessage,
  jsPsych,
  chainHolder,
  stimulusCondition,
) {
  return {
    type: ReadMessagePlugin,
    message: () => {
      const chain = chainHolder.item;
      return chain == null || chain.messages.length == 0
        ? []
        : chain.messages[chain.messages.length - 1];
    },
    prompt: "The previous participant left the following message for you:",
    data: () => {
      const chain = chainHolder.item;
      return {
        phase: "readMessage",
        chainId: chain._id,
        messageReceived: chain.messages[chain.messages.length - 1],
        characterLimit: messageConditionLimits[chainHolder.messageCondition],
        stimulusCondition: stimulusCondition,
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

function getLearningTrials(stimulusCondition, jsPsych) {
  const fishes = fishesByCondition[stimulusCondition].fishes;
  const nTrials = nTrialsByCondition[stimulusCondition];
  const observations = fishesByCondition[stimulusCondition].observations;

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
      data: function () {
        const caughtFish = jsPsych.timelineVariable("fishCaught");
        return {
          phase: "learning",
          fishCaught: caughtFish,
          stimulusCondition: stimulusCondition,
        };
      },
      choices: ["Continue"],
    },
  ];

  const learningTimeline = {
    timeline: learningStages,
    timeline_variables: observations.map((f) => {
      return {
        fishCaught: f,
      };
    }),
    randomize_order: true,
  };

  timeline.push(learningTimeline);
  return timeline;
}

function getWriteMessageTrials(stimulusCondition, chainHolder) {
  const timeline = [];

  const writeMessageTrial = {
    type: SendMessagePlugin,
    choices: fishesByCondition[stimulusCondition].fishes,
    length: () => {
      const chain = chainHolder.item;
      return messageConditionLimits[chainHolder.messageCondition];
    },
    prompt: () => {
      const messageCondition = chainHolder.messageCondition;
      const characterLimit = messageConditionLimits[messageCondition];
      let ret = `Please write a message to help the next participant. You can send ${characterLimit} symbol`;
      if (characterLimit > 1) {
        ret += "s";
      }
      return ret + ".";
    },
    on_finish: function (data) {
      const chain = chainHolder.item;
      sendMessage(chain._id, data.message);
    },
    data: () => {
      const chain = chainHolder.item;
      return {
        phase: "writeMessage",
        characterLimit: messageConditionLimits[chainHolder.messageCondition],
        chainId: chain._id,
        stimulusCondition: stimulusCondition,
      };
    },
  };
  timeline.push(writeMessageTrial);

  return timeline;
}

function getTestTrials(stimulusCondition, phaseName) {
  const timeline = [];

  timeline.push({
    type: HtmlButtonResponse,
    stimulus: testPhaseInstructions,
    choices: ["Begin"],
  });

  // add dependent measure
  timeline.push({
    type: ElicitDistributionPlugin,
    stimulusCondition: stimulusCondition,
    data: { phase: phaseName, stimulusCondition: stimulusCondition },
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
        prompt: "How did you decide how to set the information value?",
        rows: 6,
        columns: 50,
        name: "information",
      },
      {
        prompt: "How did you decide how to send a message?",
        rows: 6,
        columns: 50,
        name: "message",
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
    data: { phase: "postExperimentSurvey" },
  };
  return postExperimentSurvey;
}

function getOnePracticeRound(
  doLearning,
  writeMessage,
  receiveMessage,
  stimulusCondition,
  nTrials,
  characterLimit,
  jsPsych,
) {
  const fishes = fishesByCondition[stimulusCondition].fishes;
  const fishProbs = fishesByCondition[stimulusCondition].probs;

  const practiceRoundTimeline = [];

  practiceRoundTimeline.push({
    type: HtmlButtonResponse,
    stimulus: getBlockHeaderHTML(stimulusCondition),
    choices: ["Continue"],
  });

  if (receiveMessage == 1) {
    const exampleMessage = range(characterLimit).map(() =>
      sampleFish(fishes, fishProbs),
    );
    practiceRoundTimeline.push({
      type: ReadMessagePlugin,
      message: exampleMessage,
      prompt: "Here is an example message:",
      choices: ["Continue"],
      data: {
        phase: "readMessage",
        chainId: "practiceChainId",
        messageReceived: exampleMessage,
        characterLimit: characterLimit,
        stimulusCondition: stimulusCondition,
      },
    });
    // add dependent measure
    practiceRoundTimeline.push(
      ...getTestTrials(stimulusCondition, "elicitPrior"),
    );
  }

  practiceRoundTimeline.push({
    type: HtmlButtonResponse,
    stimulus: `<p>You will now start the learning trials. Press "continue" to begin.</p>`,
    choices: ["Continue"],
    data: {
      stimulusCondition: stimulusCondition,
    },
  });

  const learningStages = [
    {
      type: HtmlButtonResponse,
      stimulus: "Click the fishing rod to catch a fish",
      choices: ["fish"],
      data: {
        phase: "learning",
      },
      button_html: fishingRodHTML,
    },
    {
      type: HtmlButtonResponse,
      stimulus: function () {
        const caughtFish = jsPsych.timelineVariable("fishCaught");
        return formatCaughtFish(caughtFish);
      },
      data: function () {
        return {
          phase: "learning",
          fishCaught: jsPsych.timelineVariable("fishCaught"),
          stimulusCondition: stimulusCondition,
        };
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
    randomize_order: false,
  };
  practiceRoundTimeline.push(learningTimeline);

  if (writeMessage == 1) {
    const writeMessageTrial = {
      type: SendMessagePlugin,
      choices: fishesByCondition[stimulusCondition].fishes,
      length: characterLimit,
      prompt:
        characterLimit == 1
          ? `Please write a message to help the next participant. You can send ${characterLimit} symbol.`
          : `Please write a message to help the next participant. You can send ${characterLimit} symbols.`,
      data: {
        phase: "writeMessage",
        stimulusCondition: stimulusCondition,
        characterLimit: characterLimit,
      },
    };
    practiceRoundTimeline.push(writeMessageTrial);
  }

  // add dependent measure
  practiceRoundTimeline.push(
    ...getTestTrials(stimulusCondition, "elicitPosterior"),
  );

  // feedback
  practiceRoundTimeline.push({
    type: HtmlButtonResponse,
    stimulus: () => {
      // get the probs and conf
      const counts = jsPsych.data
        .get()
        .filter({ phase: "elicitPosterior" })
        .last(1)
        .values()[0].probs;
      const conf = jsPsych.data
        .get()
        .filter({ phase: "elicitPosterior" })
        .last(1)
        .values()[0].conf;

      const trueProbs = fishesByCondition[stimulusCondition].probs;
      const trueColors = fishesByCondition[stimulusCondition].fishes;

      const trueProbString =
        "There were " +
        trueProbs
          .slice(0, trueProbs.length - 1)
          .map((p, i) => `${p * 10} ${trueColors[i]},`)
          .join(" ") +
        " and " +
        `${trueProbs[trueProbs.length - 1] * 10} ${
          trueColors[trueColors.length - 1]
        }` +
        " fish in the pond.";

      const isCorrect = trueProbs.every((p, i) => {
        return Math.abs(p - counts[i] / 10) < 0.1;
      });

      const isClose = trueProbs.every((p, i) => {
        return Math.abs(p - counts[i] / 10) < 0.3;
      });

      const correctString = isCorrect
        ? "<p class='instructions-text'>Your prediction was correct!</p>"
        : isClose
        ? "<p class='instructions-text'>Your prediction was close!</p>"
        : "<p class='instructions-text'>Your prediction was far from the true numbers.</p>";

      const feedbackMessage = `<p class="instructions-text">${trueProbString}</p>
                               <p>${correctString}</p>`;
      return feedbackMessage;
    },
    choices: ["Continue"],
  });

  return practiceRoundTimeline;
}

function getPracticeRounds(doLearning, writeMessage, receiveMessage, jsPsych) {
  const practiceTimeline = [];

  let practiceMessage = `<p class="instructions-text">You will now complete three practice rounds. Press "continue" to begin.</p>`;
  if (doLearning == 0) {
    practiceMessage += `<p class="instructions-text">Unlike the main experiment, in the practice rounds you will <strong>catch fish at each pond</strong> before reporting your beliefs.</p>`;
  }

  practiceTimeline.push({
    type: HtmlButtonResponse,
    stimulus: practiceMessage,
    choices: ["Continue"],
  });

  shuffle(practiceStimulusConditions);
  shuffle(practiceConditionNObs);
  shuffle(practiceMessageConditionLimits);

  for (let i = 0; i < practiceStimulusConditions.length; i++) {
    const stimulusCondition = practiceStimulusConditions[i];
    const nObsCategory = practiceConditionNObs[i];
    const nObs = Math.random() < 0.5 ? nObsCategory[0] : nObsCategory[1];
    const characterLimit = practiceMessageConditionLimits[i];
    practiceTimeline.push(
      ...getOnePracticeRound(
        doLearning,
        writeMessage,
        receiveMessage,
        stimulusCondition,
        nObs,
        characterLimit,
        jsPsych,
      ),
    );
  }

  practiceTimeline.push({
    type: HtmlButtonResponse,
    stimulus: `<p class="instructions-text">You have completed the practice rounds! Press 'Continue' to begin the main experiment.</p>`,
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
  const chainHolder = { item: chain, messageCondition: null };

  const jsPsych = initJsPsych({
    show_progress_bar: true,
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

  const stimulusConditions = [0, 1, 2, 3];
  const doLearning = jsPsych.data.getURLVariable("doL");
  const receiveMessage = jsPsych.data.getURLVariable("recM");
  const writeMessage = jsPsych.data.getURLVariable("wM");
  const timeline = [];

  // add the initial trials
  timeline.push(
    ...getInitialTrials(
      assetPaths,
      doLearning,
      writeMessage,
      receiveMessage,
      chainHolder,
      jsPsych,
    ),
  );

  timeline.push(
    ...getPracticeRounds(doLearning, writeMessage, receiveMessage, jsPsych),
  );

  shuffle(stimulusConditions);
  for (let stimulusCondition of stimulusConditions) {
    let blockTimeline = [];

    blockTimeline.push(
      getBlockHeader(
        stimulusCondition,
        receiveMessage,
        writeMessage,
        chainHolder,
      ),
    );

    // add receive message tiral
    if (receiveMessage == 1) {
      blockTimeline.push(
        getReceiveMessageTrial(
          writeMessage,
          jsPsych,
          chainHolder,
          stimulusCondition,
        ),
      );

      // then add the post-message elicitation
      blockTimeline.push(...getTestTrials(stimulusCondition, "elicitPrior"));
    }

    // add the learning trials
    if (doLearning == 1) {
      blockTimeline.push(...getLearningTrials(stimulusCondition, jsPsych));
    }

    // add the message writing trials
    if (writeMessage == 1) {
      blockTimeline.push(
        ...getWriteMessageTrials(stimulusCondition, chainHolder),
      );
    }

    // add the test trials
    blockTimeline.push(...getTestTrials(stimulusCondition, "elicitPosterior"));

    timeline.push({
      timeline: blockTimeline,
      timeline_variables: [{ stimulusCondition: stimulusCondition }],
    });
  }

  timeline.push(getPostExperimentSurvey());

  timeline = await jsPsych.run(timeline);
}
