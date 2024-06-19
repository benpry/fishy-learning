var { jStat } = require("jstat");

export function range(n) {
  return [...Array(n).keys()];
}

// Fisher-Yates shuffle algorithm from here: https://stackoverflow.com/a/2450976
export function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export function sampleFish(fishes, probs) {
  // Sample a fish from a list of fishes with given probabilities.
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < probs.length; i++) {
    sum += probs[i];
    if (r < sum) {
      return fishes[i];
    }
  }
  return fishes[fishes.length - 1];
}

function renderLines(message) {
  // render a message to html by turning lines into paragraphs
  return message
    .split("\n")
    .map((line) => `<p class="message-text">${line}</p>`)
    .join("");
}

export function renderMessage(message) {
  return `<p class="instructions-text">The following message was written by the previous participant to help you do well on this task:</p>
   ${renderLines(message)}
   <p class="instructions-text">Press "Continue" when you have finished reading.</p>
`;
}

export function findHDI(alpha, beta) {
  const mode = (alpha - 1) / (alpha + beta - 2);
  let lower = mode - 0.01;
  let upper = mode + 0.01;

  while (
    jStat.beta.cdf(upper, alpha, beta) - jStat.beta.cdf(lower, alpha, beta) <
    0.5
  ) {
    if (
      jStat.beta.cdf(upper + 0.01, alpha, beta) -
        jStat.beta.cdf(lower, alpha, beta) >
      jStat.beta.cdf(upper, alpha, beta) -
        jStat.beta.cdf(lower - 0.01, alpha, beta)
    ) {
      upper += 0.01;
    } else {
      lower -= 0.01;
    }
  }

  lower = Math.max(0, lower);
  upper = Math.min(1, upper);

  return [lower, upper];
}
