import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { colors } from "./constants";

const info = {
  name: "read-message",
  parameters: {
    /** If true, then trial will end when user responds. */
    message: {
      type: ParameterType.LIST,
      pretty_name: "List of colors",
    },
    prompt: {
      type: ParameterType.STRING,
      pretty_name: "Prompt",
    },
  },
};

type Info = typeof info;

/**
 * read-message
 * jsPsych plugin for reading a message made up of differently-colored circles
 * @author Ben Prystawski
 */
class ReadMessagePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // store response
    var response = {
      rt: null,
      button: null,
    };

    let html = `
      <div id="jspsych-read-message-stimulus" style="justify-content: center; align-items: center;">
    `;

    if (trial.prompt !== undefined) {
      html += `<div><p>${trial.prompt}</p></div>`;
    }

    html += `<div style="justify-content: center; align-items: center; min-height: 100px">`;

    if (trial.message.length == 0) {
      html += "<p>The participant left the message blank.</p>";
    } else {
      for (let i = 0; i < trial.message.length; i++) {
        html += `
          <svg height="90" width="90" xmlns="http://www.w3.org/2000/svg">
              <circle r="40" cx="45" cy="45" fill="${
                colors[trial.message[i]]
              }" stroke="black" stroke-width="3px" />
          </svg>
            `;
      }
    }

    html += "</div></div>";

    // function to end trial when it is time
    const end_trial = () => {
      // kill any remaining setTimeout handlers
      this.jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    function after_response(probs, conf) {
      // measure rt
      var end_time = performance.now();
      var rt = Math.round(end_time - start_time);
      response.probs = probs;
      response.conf = conf;
      response.rt = rt;

      end_trial();
    }

    display_element.innerHTML = html;
    const continueButton = document.createElement("button");
    continueButton.classList.add("jspsych-btn");
    continueButton.innerHTML = "Continue";
    continueButton.onclick = () => {
      after_response();
    };
    display_element.appendChild(continueButton);

    // start time
    var start_time = performance.now();
  }
}

export default ReadMessagePlugin;
