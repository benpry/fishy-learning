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
    <img src="assets/images/${fishColor.replace(
      " ",
      "-",
    )}-fish.svg" class="fish"/>
    </div>
    </div>
    `;
};

export const colors = {
  cyan: "#66ccee",
  "light grey": "#bbbbbb",
  "dark grey": "#666666",
  blue: "#4477aa",
  yellow: "#ccbb44",
  purple: "#aa3377",
  green: "#228833",
  white: "#FFFFFF",
  red: "#ee6677",
  black: "#222222",
};

export const nTrialsByCondition = {
  0: 3,
  1: 3,
  2: 3,
  3: 3,
  4: 3,
};

export const messageConditionTimes = {
  0: 2,
  1: 5,
  2: 10,
  3: 30,
};

export const fishesByCondition = {
  0: {
    fishes: ["white", "purple"],
    probs: [0.8, 0.2],
  },
  1: {
    fishes: ["dark grey", "blue"],
    probs: [0.4, 0.6],
  },
  2: {
    fishes: ["yellow", "green"],
    probs: [0.1, 0.9],
  },
  3: {
    fishes: ["black", "cyan"],
    probs: [0.7, 0.3],
  },
  4: {
    fishes: ["light grey", "red"],
    probs: [0.5, 0.5],
  },
  "-1": {
    fishes: ["blue", "red"],
    probs: [0.26, 0.74],
  },
  "-2": {
    fishes: ["cyan", "white"],
    probs: [0.63, 0.37],
  },
  "-3": {
    fishes: ["purple", "light grey"],
    probs: [0.19, 0.81],
  },
};

const lakeNames = {
  0: "Lake Kuolmo",
  1: "Lake Onki",
  2: "Lake Pihla",
  3: "Lake Jonu",
  4: "Lake Sava",
  "-1": "Lake Ori",
  "-2": "Lake Teli",
  "-3": "Lake Lumm",
};

const timeEstimate = 10;
const basePayment = 2;
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

export const getBlockHeaderHTML = (condition) => {
  const nFishes = nTrialsByCondition[condition];
  const fishNames = fishesByCondition[condition].fishes;
  const fishImages = fishNames
    .map((fish) => fishHTML.replace("%choice%", fish.replace(" ", "-")))
    .join("\n");
  return `<h1>${lakeNames[condition]}</h1>
<p class="instructions-text">You are now visiting ${
    lakeNames[condition]
  }. There are ${
    fishNames.length
  } types of fish in the lake. They are:\n${fishNames.join(", ")}.</p>
${fishImages}
<p class="instructions-text">You know there is at least one of each type of fish in the lake.</p>
`;
};

export const testPhaseInstructions = eval(
  "`" + testPhaseInstructionsHtml + "`",
);

export const getWriteMessageInstructions = (messageWritingTime) => {
  return eval("`" + writeMessageHtml + "`");
};
