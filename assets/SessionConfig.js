
// import { STAGE, FACEAPI, QUESTION } from "../src/managers/Definitions"
const { STAGE, FACEAPI, QUESTION } = require("../src/managers/Definitions")


try{
  const fs = require("fs");
  const { PostChatSurvey } = require("./PostChatSurvey");
  fs.writeFileSync('./assets/SurveyExport.json', JSON.stringify(PostChatSurvey, null, 3));
  console.log("Survey json file exported to " + './SurveyExport.json',)
} catch(error){
  console.log('Error writing survey json file', error)
}

const videoChatDuration = 180;
const warmupDuration = 120;
const makeStage = (tag="NONE", name="Experiment", topic=QUESTION.TYPE.ICEBREAKER, videoStageDuration=10, mask={}) => {
  return {
    tag: tag,
    name: name,
    topic: topic,
    steps: [{
        name: "Video",
        type: STAGE.TYPE.VIDEO_CHAT,
        duration: videoStageDuration,
        params: {
          mask_settings: {...mask}
        }
      },
      {
        name: "Survey",
        type: STAGE.TYPE.SURVEY,
      }
    ]
  }
}

const SessionConfig = {
  available_conditions: [[], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH], [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE], [FACEAPI.LANDMARK.MOUTH]],
  // stages: testStages
}

// SessionConfig.available_conditions.map((condition, index) => makeStage('FINAL', `Experiment - ${index}`, QUESTION.TYPE.QUEST, videoChatDuration,
// // {show_features: condition}
// {pick_random_condition: true, no_repetitions: true}
// ));

const finalStages = [
  makeStage('FINAL', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {}),
  ...SessionConfig.available_conditions.map((condition, index) => makeStage('FINAL', `Experiment - ${index}`, QUESTION.TYPE.QUEST, videoChatDuration, {pick_random_condition: true, no_repetitions: true})),
  {
    name: "Experiment - Interview Placeholder",
    topic: QUESTION.TYPE.QUEST,
    steps: [
      {
        name: "Survey",
        surveyId: "interviewWaiting",
        type: STAGE.TYPE.SURVEY,
      }
    ]
  }
];

const testStages = [
  // makeStage('TEST', `Warm-Up`, QUESTION.TYPE.ICEBREAKER, warmupDuration, {}),
  ...SessionConfig.available_conditions.map((condition, index) => makeStage('TEST', `Experiment - ${index}`, QUESTION.TYPE.QUEST, 10, {pick_random_condition: true, no_repetitions: true})),
  
];

SessionConfig.stages = testStages;
console.log(SessionConfig);

// const testStages = [
//   {
//     name: "Test Randomized",
//     topic: QUESTION.TYPE.ICEBREAKER,
//     steps: [
//       {
//         name: "Video",
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: 10,
//         params: {
//           mask_settings: {
//             pick_random_condition: true,
//             no_repetitions: true
//           },
//         }
//       },
//       {
//         name: "Survey",
//         type: STAGE.TYPE.SURVEY,
//         survey: "test",
//       }
//     ]
//   },
//   {
//     name: "Test 1",
//     topic: QUESTION.TYPE.ICEBREAKER,
//     steps: [
//       {
//         name: "Video",
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: 10,
//         params: {
//           mask_settings: {
//             // "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.JAWOUTLINE, FACEAPI.LANDMARK.NOSE]
//           },
//         }
//       },
//       {
//         name: "Survey",
//         type: STAGE.TYPE.SURVEY,
//         survey: "test",
//       }
//     ]
//   },{
//     name: "Test 2",
//     topic: QUESTION.TYPE.WOULDYOU,
//     steps: [
//       {
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: 100,
//         params: {
//           mask_settings: {
//             "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH]
//           },
//         }
//       },
//       {
//         name: "Survey",
//         type: STAGE.TYPE.SURVEY,
//         survey: "test",
//       }
//     ]
//   },
//   {
//     name: "Test Survey 2",
//     topic: QUESTION.TYPE.ICEBREAKER,
//     steps: [
//       {
//         params: {
//           "test": true,
//         },
//         type: STAGE.TYPE.SURVEY,
//       }
//     ]
//   },{
//     name: "Start Mask 2",
//     topic: QUESTION.TYPE.ICEBREAKER,
//     steps: [
//       {
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: 100,
//         params: {
//           mask_settings: {
//             "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE]
//           }
//         }
//       }
//     ]
//   },
//   {
//     name: "Stage 1 - Video Chat Icebreaker",
//     topic: QUESTION.TYPE.ICEBREAKER,
//     steps: [
//       {
//         name: "Chat",
//         type: STAGE.TYPE.VIDEO_CHAT,
//         "duration_uncomment": 500,
//         duration: 300,
//         params: {
//           mask_settings: {
//             "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
//           },
//         }
//       },
//       {
//         name: STAGE.TYPE.SURVEY,
//         type: STAGE.TYPE.SURVEY,
//         duration: 1000,
//         params: {
//           "param1": ""
//         }
//       }
//     ]
//   },
//   {
//     name: "Stage 2",
//     steps: [
//       {
//         name: "Chat",
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: videoChatDuration,
//         params: {
//           mask_settings: {
//             "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
//           },
//           topic: QUESTION.TYPE.WOULDYOU
//         }
//       },
//       {
//         name: STAGE.TYPE.SURVEY,
//         type: STAGE.TYPE.SURVEY,
//         duration: 150,
//         params: {
//           "param1": ""
//         }
//       }
//     ]
//   },
//   {
//     name: "Stage 3",
//     steps: [
//       {
//         name: "Chat",
//         type: STAGE.TYPE.VIDEO_CHAT,
//         duration: videoChatDuration,
//         params: {
//           mask_settings: {
//             "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
//           },
//           topic: QUESTION.TYPE.QUEST
//         }
//       },
//       {
//         name: STAGE.TYPE.SURVEY,
//         type: STAGE.TYPE.SURVEY,
//         duration: 90,
//         params: {
//           "param1": ""
//         }
//       }
//     ]
//   },
//   {
//     name: "End",
//     steps: [
//       {
//         type: STAGE.TYPE.SURVEY,
//         duration: 90,
//         params: {
//           "param1": ""
//         }
//       }
//     ]
//   }
// ]



module.exports = { SessionConfig }