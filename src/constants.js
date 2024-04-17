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
  0: 10,
  1: 10,
  2: 10,
  3: 10,
};

export const messageConditionTimes = {
  0: 5,
  1: 10,
  2: 30,
};

export const fishesByCondition = {
  0: {
    fishes: ["cyan", "light grey"],
    probs: [0.8, 0.2],
  },
  1: {
    fishes: ["dark grey", "blue"],
    probs: [0.2, 0.8],
  },
  2: {
    fishes: ["yellow", "green", "white"],
    probs: [0.1, 0.7, 0.2],
  },
  3: {
    fishes: ["red", "black", "purple"],
    probs: [0.2, 0.1, 0.7],
  },
  "-1": {
    fishes: ["blue", "red"],
    probs: [0.33, 0.67],
  },
};

const lakeNames = {
  0: "Lake Blicket",
  1: "Lake Dax",
  2: "Lake Fep",
  3: "Lake Gorp",
};

const timeEstimate = 5;
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
${fishImages}`;
};

export const testPhaseInstructions = eval(
  "`" + testPhaseInstructionsHtml + "`",
);

export const getWriteMessageInstructions = (messageWritingTime) => {
  return eval("`" + writeMessageHtml + "`");
};
