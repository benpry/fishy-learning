export function range(n) {
  return [...Array(n).keys()];
}

export function sampleBucket(buckets, probs) {
  // Sample a bucket from a list of buckets with given probabilities.
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < probs.length; i++) {
    sum += probs[i];
    if (r < sum) {
      return buckets[i];
    }
  }
  return buckets[buckets.length - 1];
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
