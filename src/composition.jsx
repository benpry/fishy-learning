import React from "react";
import { range } from "./utils";
import { fishesByCondition, colors } from "./constants";
import { useState } from "react";

export default function ComposeMessage(props) {
  const stimulusCondition = props.stimulusCondition;
  const fishNames = fishesByCondition[stimulusCondition].fishes;
  const nFishes = fishNames.length;
  const initialization = props.initialization || {
    probs: Array(nFishes).fill(""),
    conf: "",
  };
  // the confidence you would have to have for a uniform distribution
  const minConf = 1;
  const maxConf = 15;

  const maxRevealed = props.revealedLimit || nFishes + 1;

  const [counts, updateCounts] = useState(
    initialization.probs.map((x) => x * 20),
  );
  const [revealed, updateRevealed] = useState(Array(nFishes + 1).fill(true));
  const [conf, updateConf] = useState(initialization.conf);
  const [responseMessage, setResponseMessage] = useState(
    "Press 'Send' to send this message.",
  );
  const [warned, setWarned] = useState(false);

  const handleSubmit = () => {
    if (
      counts.some((fishCount, i) => revealed[i] && fishCount == "") ||
      (conf === "" && revealed[nFishes])
    ) {
      setResponseMessage("Please fill in all of the values before submitting.");
    } else if (counts.some((c, i) => revealed[i] && (c < 1 || c > 20))) {
      setResponseMessage(
        "Please enter a number between 1 and 20 for each fish",
      );
      return;
    } else if (revealed.filter((x) => x).length < maxRevealed && !warned) {
      setWarned(true);
      alert(
        `You have set fewer values than you are allowed to. You can still send this message, but please double-check that this is the message you want to send before submitting. Press 'Send' again if you are sure you want to send it.`,
      );
    } else if (revealed.filter((x) => x).length > maxRevealed) {
      setResponseMessage(
        "Too many values are revealed! You must hide more values before you can send the message.",
      );
    } else {
      const message = {};
      revealed.forEach((r, i) => {
        if (r) {
          if (i === nFishes) {
            message["information"] = conf;
          } else {
            message[fishNames[i]] = counts[i];
          }
        }
      });
      props.submitFn(message);
    }
  };

  const updateRevealedFactory = (i) => {
    return () => {
      const newRevealed = revealed.slice();
      newRevealed[i] = !newRevealed[i];
      updateRevealed(newRevealed);
    };
  };

  const rowStyle = {
    display: "grid",
    margin: "auto",
    gridTemplateColumns: `repeat(${nFishes}, 1fr)`,
  };

  const itemStyle = {
    margin: "0 1rem",
  };

  return (
    <div>
      <h1>Send a message</h1>
      <p
        className="instructions-text"
        style={{ margin: "1rem auto", textAlign: "center" }}
      >
        {maxRevealed == 1 ? (
          <span>You can send at most 1 value.</span>
        ) : (
          <span>You can send at most {maxRevealed} values.</span>
        )}
      </p>
      <div className="elicitation-row" style={rowStyle}>
        {range(nFishes).map((i) => (
          <div key={i} style={itemStyle} className="prob-wrapper">
            <div className="prob-bar-wrapper">
              {revealed[i] ? (
                <div
                  className="prob-bar"
                  style={{
                    height: `${counts[i] * 5}%`,
                    backgroundColor: colors[fishNames[i]],
                  }}
                />
              ) : null}
            </div>
            <div>
              <button
                className="jspsych-btn"
                value={revealed[i]}
                onClick={updateRevealedFactory(i)}
              >
                {fishNames[i]}
              </button>
              <br />
              {revealed[i] ? (
                <input
                  key={i}
                  type="number"
                  step="1"
                  min="1"
                  max="20"
                  value={counts[i]}
                  onChange={(e) => {
                    e.preventDefault();
                    const newCounts = counts.slice();

                    let countInt = parseInt(e.target.value);
                    countInt = countInt > 20 ? 20 : countInt < 1 ? 1 : countInt;

                    newCounts[i] = countInt;
                    updateCounts(newCounts);
                  }}
                />
              ) : (
                <div style={{ height: "32px" }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <br />
      <div
        className="confidenceBlock jspsych-html-slider-response-container"
        style={{
          position: "relative",
          margin: "0 auto 3em auto",
          width: "300px",
          textAlign: "left",
        }}
      >
        <button
          className="jspsych-btn"
          onClick={updateRevealedFactory(nFishes)}
        >
          Information
        </button>
        :{" "}
        {revealed[nFishes] ? (
          <span>
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
          </span>
        ) : null}
      </div>
      <button className="jspsych-btn" onClick={handleSubmit}>
        Send
      </button>
      <div className="responseMessage">
        <p className="instructions-text" style={{ margin: "auto" }}>
          {responseMessage}
        </p>
      </div>
    </div>
  );
}
