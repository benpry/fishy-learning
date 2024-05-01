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
import {
  shuffle,
  sampleFish,
  renderMessage,
  startTimer,
  startPreWritingTimer,
} from "./utils";
import { range } from "./utils";
import { proliferate } from "./proliferate";
import ElicitDistributionPlugin from "./elicit-distribution";
import { jStat } from "jstat";

const handleChainAssignment = (
  stimulusCondition,
  receiveMessage,
  messageCondition,
  writeMessage,
  chainHolder,
) => {
  const conditionStr = `s${stimulusCondition}m${messageCondition}`;
  if (writeMessage == 1) {
    assignToChain(conditionStr).then((c) => {
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
    assignToChainNoBusy(conditionStr).then((c) => {
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

const practiceTrialObservations = {
  "-1": ["red", "blue", "red", "red", "red"],
  "-2": ["cyan"],
  "-3": ["purple", "dark grey", "dark grey"],
};

const practiceStimulusConditions = ["-1", "-2", "-3"];

function getInitialTrials(
  assetPaths,
  doLearning,
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
      prompt:
        "The more confident you are in your predictions, the higher your potential bonus will be.",
      name: "confidence",
      options: ["true", "false"],
      required: true,
    },
    {
      prompt:
        "You will still earn a bonus from your predictions if the true numbers of fish fall outside of the range you predict.",
      name: "confidenceRange",
      options: ["true", "false"],
      required: true,
    },
  ];

  if (doLearning == 1) {
    qs.push({
      prompt: "When you catch a fish, it is permanently removed from the lake",
      name: "replacement",
      options: ["true", "false"],
      required: true,
    });
  }

  shuffle(qs);

  const correctAnswers = {
    proportions: "true",
    goal: "false",
    replacement: "false",
    confidence: "true",
    confidenceRange: "false",
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
        .filter({ task: "comprehension-check" })
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
        .filter({ task: "comprehension-check" })
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
  messageCondition,
  writeMessage,
  chainHolder,
) {
  return {
    type: HtmlButtonResponse,
    stimulus: getBlockHeaderHTML(stimulusCondition),
    choices: ["Continue"],
    on_load: () => {
      handleChainAssignment(
        stimulusCondition,
        receiveMessage,
        messageCondition,
        writeMessage,
        chainHolder,
      );
    },
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

function getLearningTrials(stimulusCondition, jsPsych) {
  const fishes = fishesByCondition[stimulusCondition].fishes;
  const nTrials = nTrialsByCondition[stimulusCondition];
  const fishProbs = fishesByCondition[stimulusCondition].probs;

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

function getWriteMessageTrials(
  stimulusCondition,
  messageWritingTime,
  chainHolder,
) {
  const timeline = [];
  const writeMessageInstructions = {
    type: HtmlButtonResponse,
    stimulus: getWriteMessageInstructions(messageWritingTime),
    on_load: () => {
      startPreWritingTimer(3);
    },
    choices: [],
    trial_duration: 3000,
  };
  timeline.push(writeMessageInstructions);

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
    on_load: () => {
      startTimer(messageWritingTime);
    },
    on_finish: function (data) {
      const chain = chainHolder.item;
      sendMessage(chain._id, data.response.message);
    },
    data: { phase: "writeMessage", stimulusCondition: stimulusCondition },
  };
  timeline.push(writeMessageTrial);

  return timeline;
}

function getTestTrials(stimulusCondition) {
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
    data: { phase: "test", stimulusCondition: stimulusCondition },
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
        prompt: "How did you decide how to set the confidence slider?",
        rows: 6,
        columns: 50,
        name: "confidence",
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

function getOnePracticeRound(
  doLearning,
  writeMessage,
  receiveMessage,
  messageWritingTime,
  stimulusCondition,
  jsPsych,
) {
  const practiceRoundTimeline = [];
  shuffle(practiceTrialObservations[stimulusCondition]);

  practiceRoundTimeline.push({
    type: HtmlButtonResponse,
    stimulus: getBlockHeaderHTML(stimulusCondition),
    choices: ["Continue"],
  });

  if (receiveMessage == 1) {
    practiceRoundTimeline.push({
      type: HtmlButtonResponse,
      stimulus: renderMessage("This is an example message."),
      choices: ["Continue"],
    });
  }

  practiceRoundTimeline.push({
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
    timeline_variables: practiceTrialObservations[stimulusCondition].map(
      (f) => {
        return {
          fishCaught: f,
        };
      },
    ),
    randomize_order: false,
  };
  practiceRoundTimeline.push(learningTimeline);

  if (writeMessage == 1) {
    const writeMessageInstructions = {
      type: HtmlButtonResponse,
      stimulus: getWriteMessageInstructions(messageWritingTime),
      on_load: () => {
        startPreWritingTimer(3);
      },
      choices: [],
      trial_duration: 3000,
    };
    practiceRoundTimeline.push(writeMessageInstructions);

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
      on_load: () => {
        startTimer(messageWritingTime);
      },
      data: { phase: "writeMessage", stimulusCondition: stimulusCondition },
    };
    practiceRoundTimeline.push(writeMessageTrial);
  }

  // add dependent measure
  practiceRoundTimeline.push(...getTestTrials(stimulusCondition));

  // feedback
  practiceRoundTimeline.push({
    type: HtmlButtonResponse,
    stimulus: () => {
      // get the probs and conf
      const probs = jsPsych.data
        .get()
        .filter({ phase: "test" })
        .last(1)
        .values()[0].probs;
      const conf = jsPsych.data
        .get()
        .filter({ phase: "test" })
        .last(1)
        .values()[0].conf;

      const trueProbs = fishesByCondition[stimulusCondition].probs;
      const trueColors = fishesByCondition[stimulusCondition].fishes;

      const trueProbString =
        "The true numbers of fish were " +
        trueProbs.map((p, i) => `${p * 100} ${trueColors[i]}`).join(", ");

      const reportedN = 2 ** (conf / 10);

      const isCorrect = trueProbs.every((p, i) => {
        const alpha = probs[i] * reportedN;
        const beta = (1 - probs[i]) * reportedN;
        const rangeMin = jStat.beta.inv(0.25, alpha, beta);
        const rangeMax = jStat.beta.inv(0.75, alpha, beta);

        return p >= rangeMin && p <= rangeMax;
      });

      const bonusSize = isCorrect
        ? reportedN < 5
          ? "small"
          : reportedN < 10
          ? "medium"
          : "large"
        : "none";

      const bonusString = isCorrect
        ? `If this were a real trial, you would have earned a ${bonusSize} bonus.`
        : "If this were a real trial, you would not have earned a bonus.";

      const feedbackMessage = `<p class="instructions-text">${trueProbString}</p>
                               <p class="instructions-text">${bonusString}</p>`;
      return feedbackMessage;
    },
    choices: ["Continue"],
  });

  return practiceRoundTimeline;
}

function getPracticeRounds(
  doLearning,
  writeMessage,
  receiveMessage,
  messageWritingTime,
  jsPsych,
) {
  const practiceTimeline = [];

  let practiceMessage = `<p class="instructions-text">You will now complete three practice rounds. Press "continue" to begin.</p>`;
  if (doLearning == 0) {
    practiceMessage += `<p class="instructions-text">Unlike the main experiment, in the practice rounds you will <strong>catch fish at each lake</strong> before reporting your beliefs.</p>`;
  }

  practiceTimeline.push({
    type: HtmlButtonResponse,
    stimulus: practiceMessage,
    choices: ["Continue"],
  });

  shuffle(practiceStimulusConditions);

  for (let stimulusCondition of practiceStimulusConditions) {
    practiceTimeline.push(
      ...getOnePracticeRound(
        doLearning,
        writeMessage,
        receiveMessage,
        messageWritingTime,
        stimulusCondition,
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
  const chainHolder = { item: chain };

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
      doLearning,
      writeMessage,
      receiveMessage,
      messageCondition,
      messageWritingTime,
      chainHolder,
      jsPsych,
    ),
  );

  timeline.push(
    ...getPracticeRounds(
      doLearning,
      writeMessage,
      receiveMessage,
      messageWritingTime,
      jsPsych,
    ),
  );

  shuffle(stimulusConditions);
  for (let stimulusCondition of stimulusConditions) {
    let blockTimeline = [];

    blockTimeline.push(
      getBlockHeader(
        stimulusCondition,
        receiveMessage,
        messageCondition,
        writeMessage,
        chainHolder,
      ),
    );

    // add receive message tiral
    if (receiveMessage == 1) {
      blockTimeline.push(
        getReceiveMessageTrial(writeMessage, jsPsych, chainHolder),
      );
    }

    // add the learning trials
    if (doLearning == 1) {
      blockTimeline.push(...getLearningTrials(stimulusCondition, jsPsych));
    }

    // add the message writing trials
    if (writeMessage == 1) {
      blockTimeline.push(
        ...getWriteMessageTrials(
          stimulusCondition,
          messageWritingTime,
          chainHolder,
        ),
      );
    }

    // add the test trials
    blockTimeline.push(...getTestTrials(stimulusCondition));

    timeline.push({
      timeline: blockTimeline,
      timeline_variables: [{ stimulusCondition: stimulusCondition }],
    });
  }

  timeline.push(getPostExperimentSurvey());

  await jsPsych.run(timeline);
}
