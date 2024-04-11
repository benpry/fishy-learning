import consentHtml from "../assets/instructions/consent.html";
import teacherInstructionsHtml from "../assets/instructions/teacher-instructions.html";
import learnerInstructionsHtml from "../assets/instructions/learner-instructions.html";
import testPhaseInstructionsHtml from "../assets/instructions/test-phase-instructions.html";
import writeMessageHtml from "../assets/instructions/write-message-instructions.html";

export const fishHTML = `
<img src="assets/images/%choice%-fish.svg", class="fish">
`;

export const formatFeedback = (
  lastCorrectFish,
  lastTrialCorrect,
  allFishes,
) => {
  let message;
  if (lastTrialCorrect) {
    message = `<span class="green bold">Correct!</span> The coin was in the ${lastCorrectFish} fish.`;
  } else {
    message = `<span class="red bold">Incorrect.</span> The coin was actually in the ${lastCorrectFish} fish.`;
  }
  const fishStimulus = allFishes
    .map((fish) => {
      const fishImg = fishHTML.replace("%choice%", fish);
      return `<div class="fishWrapper">${fishImg}</div>`;
    })
    .join("");

  return `<div>
    <div class="feedback-message">
    ${message}
    </div>
    <div class = "coinRow" style="grid-template-columns:repeat(${
      allFishes.length
    }, 1fr);width:calc(196 * ${allFishes.length});">
    <img src="assets/images/coin.svg" class="coin" style="grid-column:${
      allFishes.indexOf(lastCorrectFish) + 1
    }">
    </div>
    <div class = "fishRow">
    ${fishStimulus}
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
    fishes: ["red", "blue"],
    probs: [0.8, 0.2],
  },
  1: {
    fishes: ["red", "blue"],
    probs: [0.2, 0.8],
  },
  2: {
    fishes: ["red", "blue", "green"],
    probs: [0.1, 0.7, 0.2],
  },
  3: {
    fishes: ["red", "blue", "green"],
    probs: [0.2, 0.1, 0.7],
  },
};

const timeEstimate = 3;
const basePayment = 1;
const maxBonus = 1;

export const consentText = eval("`" + consentHtml + "`");

export const getInstructionPages = (writeMessage, messageWritingTime) => {
  if (writeMessage == 1) {
    const instructionsHtml = eval("`" + teacherInstructionsHtml + "`");
    return instructionsHtml.split("<hr/>");
  } else {
    const instructionsHtml = eval("`" + learnerInstructionsHtml + "`");
    return instructionsHtml.split("<hr/>");
  }
};

export const testPhaseInstructions = eval(
  "`" + testPhaseInstructionsHtml + "`",
);

export const getWriteMessageInstructions = (messageWritingTime) => {
  return eval("`" + writeMessageHtml + "`");
};
