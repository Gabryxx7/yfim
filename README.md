# YourFaceisMuted

## Introduction

<i>Your Face is Muted</i> xplores how a lack of non-verbal cues
affects critical conversations and our ability to empathise.
This is a two person experience. Please take a seat and wait
for your conversation partner.

# 2023 Update
We decided to revamp the project in 2023 and adapt it to be better suited for studies.

The code has been re-written almost completely therefore the whole README file had to be updated as well.

# Quick Start

## Clone repo
Clone or download the repo on your local machine, or on your online server.

```bash
> git clone https://github.com/Gabryxx7/yfim.git
```

## Install and run
Install the required packages and start the server with :

```bash
> yarn
> yarn start
```
## Background process on server
If you want to keep the node server running in the background you've got two options:
## Option 1: `screen`:
Screen allows you to start bash shells in the background and leave them running indefinitely.
Connect via `ssh` or to your online editor such as code-server and type this in the terminal:
```bash
screen
```
This will start a new background shell.
Start your code here and while it's running, you can leave this shell can go back to your foreground shell with the shortcut `CTRL+A` followed by `d` (which stands for `detach`).

After you detach the foreground shell from the background one, you can go back to do whatever you want and even leave the `ssh` session or close the terminal.

Whenever you want to check the process or stop it, you need to re-attach to it. Start with listing the available background shells with:
```bash
screen -ls
```
The output should look something like this:
```
There are screens on:
        724987.pts-1.emotion-occlusion-prod     (27/09/23 03:34:33)     (Detached)
        506775.pts-1.emotion-occlusion-prod     (02/09/23 07:42:41)     (Detached)
2 Sockets in /run/screen/S-ubuntu.
```
Note down the PID of the screen and re-attach to it with
```bash
> screen -r <Screen_ID>
> screen -r <724987>
```

## Option 2: `nohup`:
Simply run your command through nohup as follows:
```bash
nohup yarn build_start &
```
Whenever you want to stop it, you'll have to find the process id (PID) of the server, you can do that by checking which processes are listening on a certain port, in this case port 3000:
```bash
sudo lsof -i :3000
```
Note down the PID and then call:
```bash
sudo kill <PID>
```
Now you're back at the background shell with the process still running, from here you can stop it like any other terminal with `CTRL+C`.

Once you're done, exit the screen (not just deatch from it!) by typing `exit`.
## Available pages
It should work out of the box, as all config and SSL certificates are included in the bundle.
The output should look something like this:
```
Serving on port: 3000 
Available pages:  
 - Rooms: https://localhost:3000/room/:room_id/  
 Generic chat room with id 'room_id'. The room ID is extracted from the URL request sent to the server. The server then creates a new room on the backend with the extracted ID.
 
 - Control Room: https://localhost:3000/control/  
 Control room with an overview of all running rooms and their status and list of participants
 
 - Face API Video Test: https://localhost:3000/faceTest/  
 A simple page to test the face API in its face processor component (camera is initially disabled, enable it from the top left toolbar)
 
 - Surveys Test: https://localhost:3000/surveyTest/:surveyId  
 A simple page to test a survey given its id. Available surveys are TEST,POST_VIDEO_CHAT,INTERVIEW
```

You can follow the links to open each page.
If you are running this on the server, the subdomain `yfim.gmarini.com` points at the port `3000` by default, you can access the pages from these links:
```
https://yfim.gmarini.com/room/:room_id/  
https://yfim.gmarini.com/control/  
https://yfim.gmarini.com/faceTest/  
https://yfim.gmarini.com/surveyTest/:surveyId  
```

## Configuration
### Room session and steps
The configuration for each individual room session is defined in: [SessionConfig.js](./assets/SessionConfig.js).
Given a list of random mask options such as :
```javascript
featuresCombinations: [
  [],
  [ 'LeftEye', 'RightEye', 'Mouth' ],
  [ 'LeftEye', 'RightEye' ],
  [ 'Mouth' ]
]
```

The config generator runs each option through the function `makeStage(tag, name, topic, videoStageDuration, stageMaskSettings)`, given the parameters:
- `tag`: Just a textual tag for YOU to keep track of what this session represents (e.g. TEST_CONFIG, FINAL_CONFIG...)
- `name`: The generic name for each stage, they will automatically labelled sequentially as `<name> - <index>`
- `topic`: The set of questions from which to randomly pick the stage's prompt. Available question types are defined in [Definitions.js](./src/backend/Definitions.js) and they are linked to the lists of questions defined in [Topics.js](./assets/Topics.js). At the time of writing these are the options:
  - `QUESTION.TYPE.ICEBREAKER`: or `"icebreaker"`. Example question: `"What animal would you be and why?"`,
  - `QUESTION.TYPE.WOULDYOU`: or `"wouldyou"`. Example question: `"Would you rather have no taste or be colourblind?"`,
  - `QUESTION.TYPE.QUEST_CATEGORIES`: It is a list itself, containing generic questions divided in three categories `[KIDS, MATURE, GENERAL]`.
  - `QUESTION.TYPE.QUEST`: or `"quest"`. This list of questions contains all questions from the the two categories `MATURE` and `GENERAL`. These types of questions require two parts. Example questions:
  `You are arguing that climate change is man-made.` vs 
  `You are arguing that climate changes follow natural cycles.`

Questions with two versions will be assigned to each user depending on the order in which they joined the room. For instance in the example above, the first user to join/create the room will get the question ad index 0 `You are arguing that climate change is man-made.`, while the next user will get the question version at index 1 `You are arguing that climate changes follow natural cycles.`.

Which returns a new stage structured as:

```javascript
{
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
```
The general structure is as follows:

```javascript
{
  featuresCombinations: [
    [],
    [ 'LeftEye', 'RightEye', 'Mouth' ],
    [ 'LeftEye', 'RightEye' ],
    [ 'Mouth' ]
  ],
  stages: [
    {
      tag: 'FINAL',
      name: 'Warm-Up',
      topic: 'icebreaker',
      maskSettings: {},
      steps: [Array]
    },
    {
      tag: 'FINAL',
      name: 'Experiment - 0',
      topic: 'quest',
      maskSettings: [Object],
      steps: [Array]
    },
  ]
}
```




## Start Application

```bash
npm i or yarn
npm start or yarn start

```

Start the server

```bash
nohup yarn start &
```

You can find all the output in the nohup.out file

ssl files: (public and private key)
at the first time to start the server, you need to copy and rename the valid public and private key into the repo directory
cp /etc/letsencrypt/live/www.happychat.tech/fullchain.pem ./rtc-video-room-cert.pem
cp /etc/letsencrypt/live/www.happychat.tech/privkey.pem ./rtc-video-room-key.pem

nginx: just for reverse proxy as server only open 80, 443 port outside
config file: /etc/nginx/sites-available/default

remember to restart nginx when you change the setting by using

The app can be accessed at:

```bash
https://localhost:3000
```

## Development

the website user see is in the dist/index.html, it have a main.js, which will be updated by webpack when we updates the code in src/

change files in the src/ directory when you need to change html or js or css, before you start, run the following command

```bash
yarn run watch
```

save your change and wait, it will take some time to pack the change and update the main.js

## Structure

    /r/:room                      -- Chating room
    /projection/:room/:usertype   -- projection pages
    /s/:room/:usertype            -- survey pages

## User Guidance

- following path will use 1 as room number as an example

### Pages

- User: Host/Guest
- Chat room: https://localhost:3000/r/1/:user
- survey page: https://localhost:3000/s/1/:user (user here can be host or guest)
- projection page: https://localhost:3000/projection/1/:user

## Developers' Guide

Developer can write the frontend js files in the src directory and import them as a component and add them in /src/index.js

## Server Data

### Data

- Mask setting (endWithEyes,...)
- Questionnaire_set ()

## Data Schema

In this project, we are going to use couchDB as database to restore json format data.

```json
// sessionid is the time process started and formatted like "year/month/day/hour/min/second" e.g. "2020/6/1/6/15/24"
{
  "_id": "sessionId",
  "time": "UTC",
  "mask_setting": "endWithEyes",
  "topic": ["icebreaker", "wouldyou", "quest"],
  "duration": "180", //(optional, process duration)
  "host": {
    "question": [
        {
            "submit_time": "UTC",
            "result":{
                "question1": "item1",
                "question2": "item2"
            },
        },
        {},
        {}
    ],
    "emotion": [{"stage1 emotion see below"}, {}, {}]
  },
  "guest": {
    //same as host
  }
}
```

For each stage emotion:

```json
{
  "record_count": 30,
  "record_detail": [
    {
      "timestamp": "UTC",
      "time_slot": 9, //indicate x(9) seconds since the stage start
      "emotion": {
        "angry": 0.09234,
        "disgusted": 0,
        "fearful": 0,
        "happy": 1,
        "neutral": 0,
        "sad": 0,
        "surprised": 0
      }
    },
    {},
    {} // ...
  ]
}
```

## Code Structure

The three main screens are managed as follows

- Main video screen: (MediaContainer.js)[src/frontend/containers/MediaContainer.js]
- Survey screen: (SurveyPage.js)[src/frontend/containers/SurveyPage.js]
- Projection screen: (ProjectionPage.js)[src/frontend/containers/ProjectionPage.js]

Main app flow and modules are managed by the (MediaContainer.js)[src/frontend/containers/MediaContainer.js] file.

## Demo

https://www.happychat.tech

# TODOs

- recording of voice should be made optional (add second checkbox to consent form)
- kids should also get 'general' topics

# Ideas

- at the end of the experience, display how accurate participants were able to guess their partner's emotion throughout the experience (i.e., guessed emotion vs. self-reported ground truth)

# Authors
- Hao Huang
- [Tilman Dingler](https://github.com/Til-D/)
- Zhanna Sarsenbayeva
- Weiwei Jiang


Release under The MIT License (MIT), copyright: Tilman Dingler, 2021

# NGINX Upload settings
Remember to increase the size limit of nginx:
[Title](https://www.cyberciti.biz/faq/linux-unix-bsd-nginx-413-request-entity-too-large/)
```sudo nano /etc/nginx/nginx.conf```

Add the following line to http or server or location context to increase the size limit in nginx.conf, enter:
```
# set client body size to 100 MB #
client_max_body_size 100M;
```

Reload
```sudo systemctl reload nginx.service```
# Windows fix
https://github.com/krakenjs/zoid-demo/issues/6