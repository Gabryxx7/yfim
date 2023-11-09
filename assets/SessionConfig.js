
import { STAGE, FACEAPI, QUESTION } from "../src/backend/Definitions.js"
// const { STAGE, FACEAPI, QUESTION } = require("../src/backend/Definitions.js")
import { AVAILABLE_SURVEYS, SURVEY_CSS_CLASSES } from "./PostChatSurvey.js"
// const { AVAILABLE_SURVEYS } = require("./PostChatSurvey.js")


// try{
//   const fs = require("fs");
//   const { AVAILABLE_SURVEYS } = require("PostChatSurvey");
//   fs.writeFileSync('./assets/SurveyExport.json', JSON.stringify(AVAILABLE_SURVEYS.POST_VIDEO_CHAT, null, 3));
//   console.log("Survey json file exported to " + './SurveyExport.json',)
// } catch(error){
//   console.log('Error writing survey json file', error)
// }

const videoChatDuration = 300; // It was 180 (3mins)
const warmupDuration = 120;
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

const SessionConfig = {
  randomChoices: [[], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE], [FACEAPI.LANDMARK.MOUTH]],
  // randomChoices: [[FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE], [FACEAPI.LANDMARK.MOUTH]],
  // stages: testStages
}

const finalStages = [
  makeStage('FINAL', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, null),
  ...SessionConfig.randomChoices.map((condition, index) => makeStage('FINAL',`Experiment - ${index}`, QUESTION.TYPE.QUEST, videoChatDuration, {pick_random_condition: true, no_repetitions: true})),
];

const testStages = [
  {
    name: "TestSurvey",
    topic: QUESTION.TYPE.QUEST,
    steps: [
      {
        name: "Survey",
        type: STAGE.TYPE.SURVEY,
        surveyModelId: AVAILABLE_SURVEYS.TEST.id,
      }
    ]
  },
  makeStage('TEST', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {visibleFeatures: [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]}),
  ...SessionConfig.randomChoices.map((condition, index) => makeStage('TEST', `Experiment - ${index}`, QUESTION.TYPE.QUEST, 10, {pick_random_condition: true, no_repetitions: true})),
  
];

// SessionConfig.stages = testStages;
SessionConfig.stages = finalStages;
console.log(SessionConfig);

export default SessionConfig;