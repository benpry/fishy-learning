import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { colors } from "./constants";

const info = {
  name: "send-message",
  parameters: {
    /** If true, then trial will end when user responds. */
    choices: {
      type: ParameterType.LIST,
      pretty_name: "List of colors participants can choose from",
    },
    length: {
      type: ParameterType.INT,
      pretty_name: "The maximum number of colors that can be sent",
    },
    prompt: {
      type: ParameterType.STRING,
      pretty_name: "Prompt",
    },
  },
};

type Info = typeof info;

/**
 * send-message
 * jsPsych plugin for sending a message consisting of a sequence of colors, chosen from a list
 * @author Ben Prystawski
 */
class SendMessagePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // store response
    var response = {
      rt: null,
      button: null,
    };

    let html = `
      <div id="jspsych-send-message-stimulus" style="justify-content: center; align-items: center;">
    `;

    if (trial.prompt !== undefined) {
      html += `<div><p>${trial.prompt}</p></div>`;
    }

    html += `<div id="curr-message" style="justify-content: center; align-items: center; height: 100px;">`;

    html += "</div></div>";

    const currMessage = [];
    let gaveWarning = false;

    const renderMessage = () => {
      let messageHTML = "";
      for (const color of currMessage) {
        const colorSVG = document.createElement("svg");
        messageHTML += `
          <svg height="90" width="90" xmlns="http://www.w3.org/2000/svg">
              <circle r="40" cx="45" cy="45" fill="${colors[color]}" stroke="black" stroke-width="3px" />
          </svg>`;
      }
      document.getElementById("curr-message").innerHTML = messageHTML;
    };

    const addColor = (color: string) => {
      if (currMessage.length < trial.length) {
        currMessage.push(color);
        renderMessage();
      }
    };

    const deleteColor = () => {
      if (currMessage.length > 0) {
        currMessage.pop();
        renderMessage();
      }
    };

    // function to end trial when it is time
    const end_trial = () => {
      // kill any remaining setTimeout handlers
      this.jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        message: currMessage,
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    function after_response() {
      // measure rt
      if (currMessage.length < trial.length && !gaveWarning) {
        alert(
          "The message you entered does not use all the allowed symbols. You can still send this message, but please double-check that this is the message you want to send before submitting.",
        );
        gaveWarning = true;
        return;
      }

      var end_time = performance.now();
      var rt = Math.round(end_time - start_time);

      end_trial();
    }

    html += `<div class="choice-list"></div>`;

    display_element.innerHTML = html;

    trial.choices.forEach((choice) => {
      const colorButton = document.createElement("button");
      colorButton.innerHTML = choice;
      colorButton.classList.add("jspsych-btn");
      colorButton.style.backgroundColor = colors[choice];
      colorButton.style.borderColor = "black";
      colorButton.style.color = "black";
      colorButton.style.fontSize = "20px";
      colorButton.style.margin = "5px";
      colorButton.style.padding = "10px";
      colorButton.onclick = () => {
        addColor(choice);
      };
      display_element.querySelector(".choice-list").appendChild(colorButton);
    });

    const deleteButtonDiv = document.createElement("div");
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "Delete";
    deleteButton.classList.add("jspsych-btn");
    deleteButton.style.margin = "5px";
    deleteButton.style.fontSize = "20px";
    deleteButton.style.padding = "10px";
    deleteButton.onclick = deleteColor;
    display_element.querySelector(".choice-list").appendChild(deleteButton);

    const submitButton = document.createElement("button");
    submitButton.classList.add("jspsych-btn");
    submitButton.style.margin = "5px";
    submitButton.innerHTML = "Submit";
    submitButton.onclick = after_response;
    display_element.appendChild(submitButton);

    // start time
    var start_time = performance.now();
  }
}

export default SendMessagePlugin;
