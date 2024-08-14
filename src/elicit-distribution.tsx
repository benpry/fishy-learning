import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { messageToProbsAndConf } from "./utils";
import React from "react";
import { createRoot } from "react-dom/client";
import Elicitation from "./Elicitation";

const info = {
  name: "elicit-distribution",
  parameters: {
    /** If true, then trial will end when user responds. */
    stimulusCondition: {
      type: ParameterType.INT,
      pretty_name: "Stimulus condition",
    },
    initialization: {
      type: ParameterType.OBJECT,
      pretty_name: "Initial state",
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
class ElicitDistributionPlugin implements JsPsychPlugin<Info> {
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
      button: null,
    };

    // function to end trial when it is time
    const end_trial = () => {
      // kill any remaining setTimeout handlers
      this.jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        rt: response.rt,
        probs: response.probs,
        conf: response.conf,
      };

      // clear the display
      display_element.innerHTML = "";

      // move on to the next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    function after_response(counts, conf) {
      // measure rt
      var end_time = performance.now();
      var rt = Math.round(end_time - start_time);
      response.probs = counts.map((c) => c / 20);
      response.conf = conf;
      response.rt = rt;

      end_trial();
    }

    const initializationProbsConf = trial.initialization
      ? trial.initialization.hasOwnProperty("probs")
        ? trial.initialization
        : messageToProbsAndConf(trial.initialization, trial.stimulusCondition)
      : null;

    const root = createRoot(node);
    root.render(
      <Elicitation
        submitFn={after_response}
        stimulusCondition={trial.stimulusCondition}
        initialization={initializationProbsConf}
      />,
    );
  }
}

export default ElicitDistributionPlugin;
