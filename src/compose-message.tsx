import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import React from "react";
import { createRoot } from "react-dom/client";
import ComposeMessage from "./composition";

const info = {
  name: "compose-message",
  parameters: {
    /** If true, then trial will end when user responds. */
    stimulusCondition: {
      type: ParameterType.INT,
      pretty_name: "Stimulus condition",
    },
    revealedLimit: {
      type: ParameterType.INT,
      pretty_name: "Max. number of numbers that can be revealed",
    },
    initialization: {
      type: ParameterType.OBJECT,
      pretty_name: "Initialization",
    },
  },
};

type Info = typeof info;

/**
 * html-button-response
 * jsPsych plugin for displaying a stimulus and getting a button response
 * @author Josh de Leeuw
 * @see {@link https://www.jspsych.org/plugins/jspsych-html-button-response/ html-button-response plugin documentation on jspsych.org}
 */
class ComposeMessagePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // display stimulus
    var html =
      '<div id="jspsych-elicit-distribution">Elicit distribution!</div>';
    display_element.innerHTML = html;
    const node = document.getElementById("jspsych-elicit-distribution");
    //show prompt if there is one
    if (trial.prompt !== null) {
      html += trial.prompt;
    }

    // start time
    var start_time = performance.now();

    // store response
    var response = {
      rt: null,
      message: null,
    };

    // function to end trial when it is time
    const end_trial = () => {
      // kill any remaining setTimeout handlers
      this.jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        message: response.message,
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    function after_response(message) {
      // measure rt
      var end_time = performance.now();
      var rt = Math.round(end_time - start_time);
      response.message = message;
      response.rt = rt;

      end_trial();
    }

    const root = createRoot(node);
    root.render(
      <ComposeMessage
        submitFn={after_response}
        stimulusCondition={trial.stimulusCondition}
        revealedLimit={trial.revealedLimit}
        initialization={trial.initialization}
      />,
    );
  }
}

export default ComposeMessagePlugin;
