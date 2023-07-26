
import { STAGE, FACEAPI, QUESTION } from "../src/managers/Definitions.js"
// const { STAGE, FACEAPI, QUESTION } = require("../src/managers/Definitions.js")
import { SURVEYS, SURVEY_CSS_CLASSES } from "./PostChatSurvey.js"
// const { SURVEYS } = require("./PostChatSurvey.js")


// try{
//   const fs = require("fs");
//   const { SURVEYS } = require("PostChatSurvey");
//   fs.writeFileSync('./assets/SurveyExport.json', JSON.stringify(SURVEYS.POST_VIDEO_CHAT, null, 3));
//   console.log("Survey json file exported to " + './SurveyExport.json',)
// } catch(error){
//   console.log('Error writing survey json file', error)
// }

const videoChatDuration = 180;
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
      { name: "Survey", type: STAGE.TYPE.SURVEY, surveyId: SURVEYS.POST_VIDEO_CHAT.id }
    ]
  }
}

const SessionConfig = {
  randomChoices: [[], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE], [FACEAPI.LANDMARK.MOUTH]],
  // stages: testStages
}

const finalStages = [
  makeStage('FINAL', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {}),
  ...SessionConfig.randomChoices.map((condition, index) => makeStage('FINAL',`Experiment - ${index}`, QUESTION.TYPE.QUEST, videoChatDuration, {pick_random_condition: true, no_repetitions: true})),
  {
    name: "Experiment - Interview Placeholder",
    topic: QUESTION.TYPE.QUEST,
    steps: [
      {
        name: "Survey",
        type: STAGE.TYPE.SURVEY,
        surveyId: SURVEYS.INTERVIEW.id,
      }
    ]
  }
];

const testStages = [
  {
    name: "TestSurvey",
    topic: QUESTION.TYPE.QUEST,
    steps: [
      {
        name: "Survey",
        type: STAGE.TYPE.SURVEY,
        surveyId: SURVEYS.TEST.id,
      }
    ]
  },
  makeStage('TEST', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {visibleFeatures: [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]}),
  ...SessionConfig.randomChoices.map((condition, index) => makeStage('TEST', `Experiment - ${index}`, QUESTION.TYPE.QUEST, 10, {pick_random_condition: true, no_repetitions: true})),
  
];

SessionConfig.stages = testStages;
console.log(SessionConfig);

export default SessionConfig;