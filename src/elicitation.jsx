import React from "react";
import { range, findHDI } from "./utils";
import { fishesByCondition, colors } from "./constants";
import { useState } from "react";

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

function getDirichletBounds(counts, n, nFishes) {
  const bounds = counts.map((c) => {
    // adding 0.33 gives us a 50% confidence interval around the median
    // which lets us avoid error bars that don't contain the point estimate
    if (c === "") {
      return [0, 1];
    }
    const p = c / 10;
    const alpha = p * n + 1;
    const beta = (1 - p) * n + 1;

    return findHDI(alpha, beta);
  });
  return bounds;
}

export default function Elicitation(props) {
  const stimulusCondition = props.stimulusCondition;
  const fishNames = fishesByCondition[stimulusCondition].fishes;
  const nFishes = fishNames.length;
  // the confidence you would have to have for a uniform distribution
  const minConf = 1;
  const maxConf = 15;

  const [counts, updateCounts] = useState(Array(nFishes).fill(""));
  const [conf, updateConf] = useState("");
  const [responseMessage, setResponseMessage] = useState(
    "Press 'Submit' when you are happy with your prediction.",
  );

  const handleSubmit = () => {
    if (counts.includes("") || conf === "") {
      setResponseMessage("Please fill in all of the values before submitting.");
    } else if (counts.some((c) => c < 1 || c > 10)) {
      setResponseMessage(
        "Please enter a number between 1 and 10 for each fish",
      );
      return;
    } else if (counts.reduce((a, b) => a + b, 0) !== 10) {
      setResponseMessage("Please make sure the numbers of fish add up to 10");
      return;
    } else {
      props.submitFn(counts, conf);
    }
  };

  const rowStyle = {
    display: "grid",
    margin: "auto",
    gridTemplateColumns: `repeat(${nFishes}, 1fr)`,
  };

  const itemStyle = {
    margin: "0 1rem",
  };

  const bounds = getDirichletBounds(counts, conf, nFishes);

  return (
    <div>
      <h1>Report your beliefs</h1>
      <p className="instructions-text" style={{ margin: "1rem auto" }}>
        Enter the number of fish of each color you think are in the pond.
      </p>
      <div className="elicitation-row" style={rowStyle}>
        {range(nFishes).map((i) => (
          <div key={i} style={itemStyle} className="prob-wrapper">
            <div className="prob-bar-wrapper">
              <div
                className="prob-bar"
                style={{
                  height: `${counts[i] * 10}%`,
                  backgroundColor: colors[fishNames[i]],
                }}
              />
            </div>
            <div>
              {fishNames[i]}
              <br />
              <input
                key={i}
                type="number"
                step="1"
                min="1"
                max="10"
                value={counts[i]}
                onChange={(e) => {
                  e.preventDefault();
                  const newCounts = counts.slice();

                  let countInt = parseInt(e.target.value);
                  countInt = countInt > 10 ? 10 : countInt < 1 ? 1 : countInt;

                  newCounts[i] = countInt;
                  updateCounts(newCounts);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <br />
      <p>
        Next, enter the total number of catches you think inform your decision
        (between 1 and 15).
      </p>
      <div
        className="confidenceBlock jspsych-html-slider-response-container"
        style={{
          position: "relative",
          margin: "0 auto 3em auto",
          width: "500px",
        }}
      >
        Information:{" "}
        <input
          key={"conf"}
          type="number"
          step="1"
          min={minConf}
          max={maxConf}
          value={conf}
          onChange={(e) => {
            e.preventDefault();
            let newConf = e.target.value;
            if (newConf < minConf) {
              newConf = minConf;
            } else if (newConf > maxConf) {
              newConf = maxConf;
            }
            updateConf(newConf);
          }}
        />{" "}
        catches
      </div>
      <button className="jspsych-btn" onClick={handleSubmit}>
        Submit
      </button>
      <div className="responseMessage">
        <p className="instructions-text" style={{ margin: "auto" }}>
          {responseMessage}
        </p>
      </div>
    </div>
  );
}
