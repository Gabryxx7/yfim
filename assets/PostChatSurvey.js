const SAMType = {
  ACTIVATION: "activation",
  DOMINANCE: "dominance",
  VALENCE: "valence",
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
  for(let i = 0; i < 5; i++){
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
    choices: getSelfAssessmentManikinChoices(samType)
  }
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
    "type": "rating",
    "name": `${type}-${name}`,
    title: prompt,
    "minRateDescription": likertChoices[0],
    "maxRateDescription": likertChoices[likertChoices.length-1]
  }
}

export const surveyJSON = {
  pages: [
    {
      title: "Emotional Self-Assessment",
      description: "Please anser the following questions considering how **YOU** felt",
      name: "Emotional Self-Assessment",
      elements: [
        makeSAMQuestion("Self", "Q1.1", SAMType.ACTIVATION, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
        makeSAMQuestion("Self", "Q1.2", SAMType.DOMINANCE, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
        makeSAMQuestion("Self", "Q1.3", SAMType.VALENCE, "How did you overall feel? Please choose the manikin that most describes **your feeling**"),
      ],
    },
    {
      title: "Assessment Of Your Partner",
      description: "Please anser the following questions considering how you think **YOUR CONVERSATION PARTNER** felt",
      name:"Assessment Of Your Partner",
      elements: [
        makeSAMQuestion("Other", "Q1.1", SAMType.ACTIVATION, "Please choose the manikin that most describes how you think **your conversation partner** felt"),
        makeSAMQuestion("Other", "Q1.2", SAMType.DOMINANCE, "Please choose the manikin that most describes how you think **your conversation partner** felt"),
        makeSAMQuestion("Other", "Q1.3", SAMType.VALENCE, "Please choose the manikin that most describes how you think **your conversation partner** felt."),
      ],
    },
    {
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
    },
  ],
  showProgressBar: "top",
  progressBarType: "questions",
  widthMode: "static",
  width: "864px",
};
