
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


const SessionConfig = [
  {
    "name": "Test Video 1",
    "steps": [
      {
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration": 30,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.JAWOUTLINE, FACEAPI.LANDMARK.NOSE]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.ICEBREAKER
        }
      }
    ]
  },
  {
    "name": "Test Survey 1",
    "steps": [
      {
        "params": {
          "test": true,
        },
        "type": STAGE.TYPE.SURVEY,
      }
    ]
  },{
    "name": "Test Video 2",
    "steps": [
      {
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration": 10,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.ICEBREAKER
        }
      }
    ]
  },
  {
    "name": "Test Survey 2",
    "steps": [
      {
        "params": {
          "test": true,
        },
        "type": STAGE.TYPE.SURVEY,
      }
    ]
  },{
    "name": "Start Mask 2",
    "steps": [
      {
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration": 10,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.ICEBREAKER
        }
      }
    ]
  },
  {
    "name": "Stage 1 - Video Chat Icebreaker",
    "steps": [
      {
        "name": "Chat",
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration_uncomment": 500,
        "duration": 30,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.ICEBREAKER
        }
      },
      {
        "name": STAGE.TYPE.SURVEY,
        "type": STAGE.TYPE.SURVEY,
        "duration": 100,
        "params": {
          "param1": ""
        }
      }
    ]
  },
  {
    "name": "Stage 2",
    "steps": [
      {
        "name": "Chat",
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration": 180,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.WOULDYOU
        }
      },
      {
        "name": STAGE.TYPE.SURVEY,
        "type": STAGE.TYPE.SURVEY,
        "duration": 150,
        "params": {
          "param1": ""
        }
      }
    ]
  },
  {
    "name": "Stage 3",
    "steps": [
      {
        "name": "Chat",
        "type": STAGE.TYPE.VIDEO_CHAT,
        "duration": 180,
        "params": {
          "mask_settings": {
            "show_features": [FACEAPI.LANDMARK.LEFTEYE, FACEAPI.LANDMARK.RIGHTEYE, FACEAPI.LANDMARK.MOUTH, FACEAPI.LANDMARK.NOSE]
          },
          "audio": true,
          "video": true,
          "question_type": QUESTION.TYPE.QUEST
        }
      },
      {
        "name": STAGE.TYPE.SURVEY,
        "type": STAGE.TYPE.SURVEY,
        "duration": 90,
        "params": {
          "param1": ""
        }
      }
    ]
  },
  {
    "name": "End",
    "steps": [
      {
        "type": STAGE.TYPE.SURVEY,
        "duration": 90,
        "params": {
          "param1": ""
        }
      }
    ]
  }
]

module.exports = { SessionConfig }