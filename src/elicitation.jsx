import React from "react";
import { range } from "./utils";
import { fishesByCondition, colors } from "./constants";
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
    // adding 0.33 gives us a 50% confidence interval around the median
    // which lets us avoid error bars that don't contain the mean
    const alpha = p * n + 0.33;
    const beta = (1 - p) * n + 0.33;
    return [
      jStat.beta.inv(0.25, alpha, beta),
      jStat.beta.inv(0.75, alpha, beta),
    ];
  });
  return bounds;
}

export default function Elicitation(props) {
  const stimulusCondition = props.stimulusCondition;
  const fishNames = fishesByCondition[stimulusCondition].fishes;
  const nFishes = fishNames.length;
  // the confidence you would have to have for a uniform distribution
  const minConf = 1;
  const maxConf = 10;

  const [probs, updateProbs] = useState(Array(nFishes).fill(1 / nFishes));
  const [conf, updateConf] = useState(minConf);

  const handleProbChange = (i, val) => {
    let newProbs = [...probs];
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
      <h1>Report your beliefs</h1>
      <div className="elicitation-row" style={rowStyle}>
        {range(nFishes).map((i) => (
          <div key={i} style={itemStyle} className="prob-wrapper">
            <div className="prob-bar-wrapper">
              <div
                className="prob-bar"
                style={{
                  height: `${probs[i] * 100}%`,
                  backgroundColor: colors[fishNames[i]],
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
              {fishNames[i]}: {(probs[i] * 100).toFixed(0)}
              <br />
              {(bounds[i][0] * 100).toFixed(0)} to
              {` ${(bounds[i][1] * 100).toFixed(0)}`}
              <input
                className="jspsych-slider prob-slider"
                key={i}
                type="range"
                min="1"
                max="99"
                value={(probs[i] * 100).toFixed(0)}
                onChange={(e) => {
                  handleProbChange(i, e.target.value / 100);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="confidenceBlock jspsych-html-slider-response-container"
        style={{
          position: "relative",
          margin: "0 auto 3em auto",
          width: "500px",
        }}
      >
        Confidence: {conf}
        <input
          key={"conf"}
          className="jspsych-slider conf-slider"
          type="range"
          min={minConf}
          max={maxConf}
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
          Use the sliders above to report a range that you are 50% sure covers
          the true number of each type of fish. You should think of the
          confidence value as the effective number of observations informing
          your guess. Remember that you will get a bonus if your range covers
          the true number, and your bonus will be larger the more confident you
          are in your predictions.
        </p>
        <p className="instructions-text">
          Press "Submit" when you are happy with your prediction.
        </p>
      </div>
    </div>
  );
}
