import consentHtml from "../assets/instructions/consent.html";
import teacherInstructionsHtml from "../assets/instructions/teacher-instructions.html";
import learnerInstructionsHtml from "../assets/instructions/learner-instructions.html";
import individualInstructionsHtml from "../assets/instructions/individual-instructions.html";
import testPhaseInstructionsHtml from "../assets/instructions/test-phase-instructions.html";
import writeMessageHtml from "../assets/instructions/write-message-instructions.html";

export const fishingRodHTML = `
<img src="assets/images/fishing-rod.svg", class="fish">
`;

export const fishHTML = `
<img src="assets/images/%choice%-fish.svg", class="fish">
`;

export const formatCaughtFish = (fishColor) => {
  return `<div>
    <div class="feedback-message">
    You caught a ${fishColor} fish!
    </div>
    <img src="assets/images/${fishColor}-fish.svg" class="fish"/>
    </div>
    </div>
    `;
};

export const nTrialsByCondition = {
  0: 5,
  1: 5,
  2: 5,
  3: 5,
};

export const messageConditionTimes = {
  0: 5,
  1: 10,
  2: 30,
};

export const fishesByCondition = {
  0: {
    fishes: ["cyan", "light-grey"],
    probs: [0.8, 0.2],
  },
  1: {
    fishes: ["dark-grey", "blue"],
    probs: [0.2, 0.8],
  },
  2: {
    fishes: ["purple", "green", "white"],
    probs: [0.1, 0.7, 0.2],
  },
  3: {
    fishes: ["red", "black", "purple"],
    probs: [0.2, 0.1, 0.7],
  },
};

const timeEstimate = 3;
const basePayment = 1;
const maxBonus = 1;

export const consentText = eval("`" + consentHtml + "`");

export const getInstructionPages = (
  writeMessage,
  receiveMessage,
  messageWritingTime,
) => {
  if (writeMessage == 1) {
    const instructionsHtml = eval("`" + teacherInstructionsHtml + "`").replace(
      /<hr \/>/g,
      "<hr/>",
    );
    return instructionsHtml.split("<hr/>");
  } else if (receiveMessage == 1) {
    const instructionsHtml = eval("`" + learnerInstructionsHtml + "`").replace(
      /<hr \/>/g,
      "<hr/>",
    );
    return instructionsHtml.split("<hr/>");
  } else {
    const individualHtml = eval("`" + individualInstructionsHtml + "`").replace(
      /<hr \/>/g,
      "<hr/>",
    );
    return individualHtml.split("<hr/>");
  }
};

export const testPhaseInstructions = eval(
  "`" + testPhaseInstructionsHtml + "`",
);

export const getWriteMessageInstructions = (messageWritingTime) => {
  return eval("`" + writeMessageHtml + "`");
};
