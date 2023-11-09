
import { STAGE, FACEAPI, QUESTION } from "../src/backend/Definitions.js"
// const { STAGE, FACEAPI, QUESTION } = require("../src/backend/Definitions.js")
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES } from "./PostChatSurvey.js"
// const { AVAILABLE_SURVEYS } = require("./PostChatSurvey.js")

const makeStage = (tag="NONE", name="Experiment", topic=QUESTION.TYPE.ICEBREAKER, videoStageDuration=10, stageMaskSettings={}) => {
  return {
    tag: tag,
    name: name,
    topic: topic,
    maskSettings: {...stageMaskSettings},
    steps: [{
        name: "Video",
        type: STAGE.TYPE.VIDEO_CHAT,
        duration: videoStageDuration,
      },
      { name: "Survey", type: STAGE.TYPE.SURVEY, surveyModelId: AVAILABLE_SURVEYS.POST_VIDEO_CHAT.id }
    ]
  }
}



/********** This is the FINAL experiment session configuration *******/

const videoChatDuration = 300; // It was 300 (5mins)
const warmupDuration = 120;
const SessionConfig = {
  options: {
    pick_random_condition: false,
    no_repetitions: true
  },
  featuresCombinations: [
    // [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE],
    // [FACEAPI.LANDMARK.RIGHTEYE],
    [],
    [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH],
    [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE],
    [FACEAPI.LANDMARK.MOUTH]
  ]
}

const finalStages = [
  makeStage('FINAL', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, null),
  ...SessionConfig.featuresCombinations.map((condition, index) => makeStage('FINAL',`Experiment - ${index}`,
      QUESTION.TYPE.QUEST,
      videoChatDuration,
      SessionConfig.options
      )),
];

/******************************************************/





// SessionConfig.stages = testStages;
SessionConfig.stages = finalStages;
console.log(SessionConfig);

export default SessionConfig;


// const testStages = [
//   {
//     name: "TestSurvey",
//     topic: QUESTION.TYPE.QUEST,
//     steps: [
//       {
//         name: "Survey",
//         type: STAGE.TYPE.SURVEY,
//         surveyModelId: AVAILABLE_SURVEYS.TEST.id,
//       }
//     ]
//   },
//   makeStage('TEST', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {visibleFeatures: [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]}),
//   ...SessionConfig.featuresCombinations.map((condition, index) => makeStage('TEST', `Experiment - ${index}`, QUESTION.TYPE.QUEST, 10, {pick_random_condition: true, no_repetitions: true})),
  
// ];
