const SAMType = {
  ACTIVATION: "activation",
  DOMINANCE: "dominance",
  VALENCE: "valence",
}

const ESMType = {
  VALENCE: {
    name: "valence",
    rate: [-3, 3],
    rateDesc: ["Very Negative", "Very Positive"]
  },
  AROUSAL: {
    name: "arousal",
    rate: [-3, 3],
    rateDesc: ["Very Calm", "Very Excited"]
  },
  ATTENTION: {
    name: "attention",
    rate: [-3, 3],
    rateDesc: ["Very Bored", "Very Engaged"]
  },
  STRESS: {
    name: "stress",
    rate: [-3, 3],
    rateDesc: ["Not Stressed At All", "Very Stressed"]
  },
  EMOTION_DURATION: {
    name: "emotion_duration",
    rateValues: [
      {value: -3, text: "5min"},
      {value: -2, text: "10min"},
      {value: -1, text: "15min"},
      {value: 0, text: "20min"},
      {value: 1, text: "30min"},
      {value: 2, text: "60min"},
      {value: 3, text: "I am not sure"}
    ]
  },
  TASK_DISTURBANCE: {
    name: "task_disturbance",
    rate: [-3, 3],
    rateDesc: ["Not Disturbed At All", "Very Disturbed"]
  },
  EMOTION_CHANGE: {
    name: "emotion_change",
    rate: [-3, 3],
    rateDesc: ["I Felt More Negative", "I Felt More Positive"]
  },
}

/**
 * For some reason I can't get the images in the assets/mankinis folder to load through webpack
 * They just don't get copied into the dist/ folder so they can't be found by the survey...
 */
const baseMankinsPath = "https://yfim.s3.ap-southeast-2.amazonaws.com/manikins/<SAMType>/<index>.png";
// const baseMankinsPath = "./manikins/<SAMType>/<index>.png";

const getSelfAssessmentManikinChoices =  (samType) => {
  const nChoices = 5;
  const choices = [];
  for(let i = 0; i < nChoices; i++){
    choices.push({
      value: `${samType}_${i+1}`,
      imageLink: baseMankinsPath.replace("<SAMType>", samType).replace("<index>", i+1)
    })
  } 
  return choices;
}

const makeSAMQuestion = (type, number, samType, prompt) => {
  return {
    type: "imagepicker",
    name: `${type}-Assessment ${number} ${samType}`,
    title: prompt,
    choices: getSelfAssessmentManikinChoices(samType),
    isRequired: true,
  }
}

const makeESMQuestion = (type, number, esmType, prompt) => {
  if(Array.isArray(esmType)){
    let name = `${type}-Assessment ${number} [`
    const elements = [];
    for(let t of esmType){
      let el = makeESMQuestion(type, number, t, prompt);
      el.titleLocation = 'hidden';
      elements.push(el);
      name += `${t.name},`
    }
    name += ']';
    return {
      title: prompt,
      type: "panel",
      name: `${type}-Assessment ${number}`,
      elements: elements
    }
  }
  let q = {
    name: `${type}-Assessment ${number} ${esmType.name}`,
    type: "rating",
    isRequired: true,
    title: prompt
  }
  let rates = {}
  if(esmType.rateValues){
    rates = {rateValues: esmType.rateValues}
  }
  else{
    rates = {
      rateMin: esmType.rate[0],
      rateMax: esmType.rate[esmType.rate.length - 1],
      minRateDescription: esmType.rateDesc[0],
      maxRateDescription: esmType.rateDesc[esmType.rateDesc.length - 1]
    }
  }
  return {...q, ...rates};
}


const likertChoices = [ 
  "Strongly disagree",
  "Disagree",
  "Undecided",
  "Agree",
  "Strongly agree"
]
const makeLikertQuestion = (type, name, prompt) => {
  return {
    type: "rating",
    name: `${type}-${name}`,
    title: prompt,
    minRateDescription: likertChoices[0],
    maxRateDescription: likertChoices[likertChoices.length-1],
    isRequired: true,
  }
}


const PostChatSurvey = {
  showProgressBar: "top",
  showPageNumbers: true,
  progressBarType: "pages",
  // widthMode: "responsive",
  widthMode: "static",
  width: "70vw",
  pages: []
}

// PostChatSurvey.pages.push({
//   title: "Emotional Self-Assessment",
//   description: "Please anser the following questions considering how **YOU** felt",
//   name: "Emotional Self-Assessment",
//   elements: [
//     makeSAMQuestion("Self", "Q1.1", SAMType.ACTIVATION, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
//     makeSAMQuestion("Self", "Q1.2", SAMType.DOMINANCE, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
//     makeSAMQuestion("Self", "Q1.3", SAMType.VALENCE, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
//   ]
// });

// PostChatSurvey.pages.push({
//   title: "Assessment Of Your Partner",
//   description: "Please anser the following questions considering how you think **YOUR CONVERSATION PARTNER** felt",
//   name:"Assessment Of Your Partner",
//   elements: [
//     makeSAMQuestion("Other", "Q1.1", SAMType.ACTIVATION, "Please choose the manikin that most describes how you think **your conversation partner** felt"),
//     makeSAMQuestion("Other", "Q1.2", SAMType.DOMINANCE, "Please choose the manikin that most describes how you think **your conversation partner** felt"),
//     makeSAMQuestion("Other", "Q1.3", SAMType.VALENCE, "Please choose the manikin that most describes how you think **your conversation partner** felt."),
//   ],
// });

PostChatSurvey.pages.push({
  title: "Emotional Self-Assessment",
  description: "Please anser the following questions considering how **YOU** felt",
  name: "Emotional Self-Assessment",
  elements: [
    makeESMQuestion("Self", "Q1.1-2", [ESMType.VALENCE, ESMType.AROUSAL], "My emotion right before doing this survey was"),
    makeESMQuestion("Self", "Q1.3", ESMType.ATTENTION, "My attention level to my ongoing task right before doing this survey could be rated as"),
    makeESMQuestion("Self", "Q1.4", ESMType.STRESS, "My stress level right before doing this survey was"),
    makeESMQuestion("Self", "Q1.5", ESMType.EMOTION_DURATION, "My emotion that I answered above has not changed for recent __ minutes."),
    makeESMQuestion("Self", "Q1.6", ESMType.TASK_DISTURBANCE, "Answering this survey disturbed my ongoing task"),
    makeESMQuestion("Self", "Q1.7", ESMType.EMOTION_CHANGE, "How did your emotions change while you are answering the survey now?"),
  ]
});

const partnerRef = "conversation partner's";
PostChatSurvey.pages.push({
  title: "Assessment Of Your Partner",
  description: "Please anser the following questions considering how you think **YOUR CONVERSATION PARTNER** felt",
  name:"Assessment Of Your Partner",
  elements: [
    makeESMQuestion("Other", "Q1.1-2", [ESMType.VALENCE, ESMType.AROUSAL], `My ${partnerRef} emotion right before doing this survey was`),
    makeESMQuestion("Other", "Q1.3", ESMType.ATTENTION, `My ${partnerRef} attention level to my ongoing task right before doing this survey could be rated as`),
    makeESMQuestion("Other", "Q1.4", ESMType.STRESS, `My ${partnerRef} stress level right before doing this survey was`),
    makeESMQuestion("Other", "Q1.5", ESMType.EMOTION_DURATION, `My ${partnerRef} emotion that I answered above has not changed for recent __ minutes.`),
    makeESMQuestion("Other", "Q1.6", ESMType.TASK_DISTURBANCE, `Answering this survey disturbed my ${partnerRef} ongoing task`),
    // makeESMQuestion("Other", "Q1.7", ESMType.EMOTION_CHANGE, `How did your ${partnerRef} emotions change while  are answering the survey now?`),
  ],
});


PostChatSurvey.pages.push({
  title: "General Feedback",
  name: "General Feedback",
  elements: [
    makeLikertQuestion("Other", "Inteface", "The interface helped me make sense of my conversation partner's emotions"),
    makeLikertQuestion("Other", "Empathy", "I was able to empathise with my conversation partner's point of view"),
    makeLikertQuestion("Other", "Convey", "I was able to convey my opinion effectively to my conversation partner"),
    makeLikertQuestion("Self", "FreeExpression", "I felt free to express my (assigned) point of view"),
    makeLikertQuestion("Self", "PartnersEmpathy", "I felt like my conversation partner was empathising with my point of view"),
    makeLikertQuestion("Self", "DiscussionUseful", "The discussion helped me see a new aspect regarding the topic"),
    makeLikertQuestion("General", "PartnersEmpathy", "I felt like my conversation partner was empathising with my point of view"),
    makeLikertQuestion("General", "DiscussionUseful", "The discussion helped me see a new aspect regarding the topic")
  ],
});

// module.exports = { PostChatSurvey }
export { PostChatSurvey }