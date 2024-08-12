import React from "react";
import { range } from "./utils";
import { fishesByCondition, colors } from "./constants";
import { useState } from "react";

export default function MessageViewer(props) {
  const stimulusCondition = props.stimulusCondition;
  const fishNames = fishesByCondition[stimulusCondition].fishes;
  const nFishes = fishNames.length;
  const message = props.message;

  const isEmpty = Object.keys(message).length === 0;

  const handleSubmit = () => {
    props.submitFn();
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
      <h1>View a message</h1>
      <p className="instructions-text" style={{ margin: "1rem auto" }}>
        {props.prompt}
      </p>
      {isEmpty ? (
        <p
          className="instructions-text"
          style={{ margin: "1rem auto", textAlign: "center" }}
        >
          The message was left empty.
        </p>
      ) : null}
      <div className="elicitation-row" style={rowStyle}>
        {range(nFishes).map((i) => (
          <div key={i} style={itemStyle} className="prob-wrapper">
            <div className="prob-bar-wrapper">
              {fishNames[i] in message ? (
                <div
                  className="prob-bar"
                  style={{
                    height: `${message[fishNames[i]] * 5}%`,
                    backgroundColor: colors[fishNames[i]],
                  }}
                />
              ) : null}
            </div>
            <div>
              {fishNames[i]}
              <br />
              {fishNames[i] in message ? (
                <span>{message[fishNames[i]]}</span>
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
        Information:{" "}
        {"information" in message ? (
          <span>{message["information"]} catches</span>
        ) : null}
      </div>
      <button className="jspsych-btn" onClick={handleSubmit}>
        Continue
      </button>
      <div className="responseMessage">
        <p className="instructions-text" style={{ margin: "auto" }}>
          Press "continue" when you are done reading at the message.
        </p>
      </div>
    </div>
  );
}
