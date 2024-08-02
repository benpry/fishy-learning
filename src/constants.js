import consentHtml from "../assets/instructions/consent.html";
import teacherInstructionsHtml from "../assets/instructions/teacher-instructions.html";
import learnerInstructionsHtml from "../assets/instructions/learner-instructions.html";
import testPhaseInstructionsHtml from "../assets/instructions/test-phase-instructions.html";

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
  blue: "#4477AA",
  red: "#EE6677",
  green: "#228833",
  yellow: "#CCBB44",
  cyan: "#66CCEE",
  purple: "#AA3377",
  white: "#FFFFFF",
  black: "#000000",
  grey: "#888888",
};

export const messageConditionLimits = {
  0: 1,
  1: 3,
  2: 6,
  3: 10,
};

export const fishesByCondition = {
  0: {
    fishes: ["purple", "red", "grey", "yellow", "cyan"],
    probs: [0.5, 0.05, 0.2, 0.05, 0.2],
    observations: ["purple", "purple", "purple", "purple", "grey", "cyan"],
  },
  1: {
    fishes: ["red", "white", "cyan", "blue", "green"],
    probs: [0.05, 0.55, 0.3, 0.05, 0.05],
    observations: ["cyan", "cyan", "white", "white", "white"],
  },
  2: {
    fishes: ["yellow", "grey", "green", "cyan", "purple"],
    probs: [0.35, 0.35, 0.2, 0.05, 0.05],
    observations: ["yellow", "yellow", "green", "grey", "grey"],
  },
  3: {
    fishes: ["white", "cyan", "green", "purple", "red"],
    probs: [0.05, 0.1, 0.5, 0.05, 0.3],
    observations: ["green", "green", "green", "cyan", "red", "red"],
  },
  "-1": {
    fishes: ["cyan", "red", "white"],
    probs: [0.3, 0.5, 0.2],
  },
  "-2": {
    fishes: ["blue", "white", "grey"],
    probs: [0.6, 0.1, 0.3],
  },
  "-3": {
    fishes: ["purple", "grey", "yellow"],
    probs: [0.2, 0.4, 0.4],
  },
};

const pondNames = {
  0: "Kuolmo Pond",
  1: "Onki Pond",
  2: "Pihla Pond",
  3: "Jonu Pond",
  "-1": "Ori Pond",
  "-2": "Teli Pond",
  "-3": "Lumm Pond",
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
  if (writeMessage == 1 && receiveMessage == 0) {
    const instructionsHtml = eval("`" + teacherInstructionsHtml + "`").replace(
      /<hr \/>/g,
      "<hr/>",
    );
    return instructionsHtml.split("<hr/>");
  } else {
    const instructionsHtml = eval("`" + learnerInstructionsHtml + "`").replace(
      /<hr \/>/g,
      "<hr/>",
    );
    return instructionsHtml.split("<hr/>");
  }
};

export const getBlockHeaderHTML = (condition) => {
  const fishNames = fishesByCondition[condition].fishes;
  const fishImages = fishNames
    .map((fish) => fishHTML.replace("%choice%", fish.replace(" ", "-")))
    .join("\n");
  return `<h1>${pondNames[condition]}</h1>
<p class="instructions-text">You are now visiting ${
    pondNames[condition]
  }. There are ${fishNames.length} types of fish in the pond: ${fishNames
    .slice(0, fishNames.length - 1)
    .join(", ")}, and ${fishNames[fishNames.length - 1]}.</p>
${fishImages}
<p class="instructions-text">You know there is at least one of each type of fish in the pond.</p>
`;
};

export const testPhaseInstructions = eval(
  "`" + testPhaseInstructionsHtml + "`",
);
