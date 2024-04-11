import React from "react";
import { range } from "./utils";
import { fishesByCondition } from "./constants";
import { useState } from "react";
var { jStat } = require("jstat");

function argmax(arr) {
  // from this stackexchange answer: https://stackoverflow.com/a/11301464
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}

function getDirichletBounds(probs, n, nFishes) {
  const bounds = probs.map((p) => {
    if (p == 0) {
      return [0, 0];
    } else if (p == 1) {
      return [1, 1];
    } else {
      const alpha = p * n;
      const beta = (1 - p) * n;
      return [
        jStat.beta.inv(0.025, alpha, beta),
        jStat.beta.inv(0.975, alpha, beta),
      ];
    }
  });
  return bounds;
}

export default function Elicitation(props) {
  const condition = props.condition;
  const fishNames = fishesByCondition[condition].fishes;
  const nFishes = fishNames.length;

  const [probs, updateProbs] = useState(Array(nFishes).fill(1 / nFishes));
  const [conf, updateConf] = useState(nFishes);

  const handleProbChange = (i, val) => {
    let newProbs = [...probs];
    if (argmax(probs) == i && probs[i] == 1 && val < probs[i]) {
      newProbs = newProbs.map((p) => p + 0.001);
    }
    newProbs[i] = val;
    // normalize probs
    const sum = newProbs.reduce((a, b) => a + b, 0);
    updateProbs(newProbs.map((p) => p / sum));
  };

  const rowStyle = {
    display: "grid",
    margin: "auto",
    gridTemplateColumns: `repeat(${nFishes}, 1fr)`,
  };

  const itemStyle = {
    margin: "0 1rem",
  };

  const bounds = getDirichletBounds(probs, conf, nFishes);

  return (
    <div>
      <h1>Predict the coin distribution</h1>
      <div className="elicitation-row" style={rowStyle}>
        {range(nFishes).map((i) => (
          <div key={i} style={itemStyle} className="prob-wrapper">
            <div className="prob-bar-wrapper">
              <div
                className="prob-bar"
                style={{
                  height: `${probs[i] * 100}%`,
                  backgroundColor: fishNames[i],
                }}
              />
              <div
                className="conf-int"
                style={{
                  bottom: `${bounds[i][0] * 100}%`,
                  top: `${(1 - bounds[i][1]) * 100}%`,
                }}
              />
            </div>
            <div>
              {fishNames[i]}: {(probs[i] * 100).toFixed(0)}%<br />[
              {(bounds[i][0] * 100).toFixed(0)}%,{" "}
              {(bounds[i][1] * 100).toFixed(0)}%]
              <input
                className="jspsych-slider prob-slider"
                key={i}
                type="range"
                min="0"
                max="100"
                value={(probs[i] * 100).toFixed(0)}
                onChange={(e) => {
                  handleProbChange(i, e.target.value / 100);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="confidenceBlock">
        Confidence:
        <input
          key={"conf"}
          className="jspsych-slider conf-slider"
          type="range"
          min={nFishes}
          max="50"
          value={conf}
          onChange={(e) => {
            const newConf = e.target.value;
            updateConf(newConf);
          }}
        />
      </div>
      <button
        className="jspsych-btn"
        onClick={() => props.submitFn(probs, conf)}
      >
        Submit
      </button>
      <div className="elicitationInstructions">
        <p className="instructions-text">
          Remember, the shaded region should cover 95% of what you think the
          probabilty might be. You will earn a bonus if the true probabilities
          fall in the region, and a larger bonus the smaller the region is.
        </p>
        <p className="instructions-text">
          Press "Submit" when you are happy with your prediction.
        </p>
      </div>
    </div>
  );
}
