// import { QUESTION } from "../src/backend/Definitions.js"
import { QUESTION } from "../src/backend/Definitions.js";

const Topics = {};
Topics[QUESTION.TYPE.WOULDYOU] = [
    "Would you rather give up social media or eat the same dinner for the rest of your life?",
    "Would you rather have no taste or be colourblind?",
    "Would you rather have the lights on or off if you knew the room was full of snakes?",
    "Would you rather win $25,000 or have your best friend win $100,000?",
    "Would you rather be reborn into the past or the future?",
    "Would you rather never age physically or never age mentally?",
    "Would you rather be hypersensitive to other people's emotions or give up your sense of compassion?",
    "Would you rather have every meeting on ZOOM or go to the office for the rest of your life?",
    "Would you rather have a rewind button or a pause button on your life?",
    "Would you rather lose your vision or your hearing?",
    "Would you rather become someone else or just stay you?",
    "Would you rather always say everything on your mind or never speak again?",
    "Would you rather make a phone call or send a text?",
    "Would you rather have x-ray vision or magnified hearing?",
    "Would you rather be stuck on an island alone or with someone who talks incessantly?",
    "Would you rather have a 5-hour dinner with a headstrong politician from an opposing party or go hungry for 2 days?",
    "Would you rather have a 5-hour dinner with Donald Trump or Vladimir Putin?",
    "Would you rather have lunch with Donald Trump or Kim Kardashian?"
],

Topics[QUESTION.TYPE.QUEST_CATEGORIES] = {}
Topics[QUESTION.TYPE.QUEST_CATEGORIES][QUESTION.CATEGORY.KIDS] = [
    [
        "Try to convince your conversation partner that homework helps in learning",
        "You are arguing that homework is a waste of time."
    ],
    [
        "Try to convince your conversation partner that homeschooling is better than a public or private school education.",
        "Try to convince your conversation partner that homeschooling is not any better than a public or private school education."
    ],
    [
        "Try to convince your conversation partner that students need to pass algebra to graduate.",
        "Try to convince your conversation partner that students do not need to pass algebra to graduate."
    ],
    [
        "Try to convince your conversation partner that students should be able to leave school grounds for lunch.",
        "Try to convince your conversation partner that students should not be able to leave school grounds for lunch."
    ],
    [
        "Try to convince your conversation partner that all students should be required to perform community service.",
        "Try to convince your conversation partner that students do not need to perform community service."
    ],
    [
        "Try to convince your conversation partner that reading literature books is important.",
        "Try to convince your conversation partner that reading literature books is not important."
    ],
    [
        "Try to convince your conversation partner that it is okay to have junk food in the cafeteria inside the school campus.",
        "Try to convince your conversation partner that it is not good to have junk food in the cafeteria inside the school campus."
    ]
];

Topics[QUESTION.TYPE.QUEST_CATEGORIES][QUESTION.CATEGORY.MATURE] = [
    [
        "You are arguing that pro-choice is vital.",
        "Try to convince your conversation partner that pro-life is vital."
    ],
    [
        "You are arguing that coal is the backbone of Australia's economy.",
        "Try to convince your conversation partner that Australia needs to divest from coal."
    ],
    [
        "You are arguing that owning a gun can protect me and my family.",
        "You are arguing that all gun ownership should be banned."
    ],
    [
        "You are arguing that feminism is crucial for reaching gender equality.",
        "You are arguing that feminism is overrated. Life is good the way it is."
    ],
    [
        "You are arguing that vaccinations should be mandatory.",
        "You are arguing that vaccination should be optional, not mandatory."
    ]
];

Topics[QUESTION.TYPE.QUEST_CATEGORIES][QUESTION.CATEGORY.GENERAL] = [
    [
        "Try to convince your conversation partner that meat is the way to go.",
        "Try to convince your conversation partner that vegan is the way to go."
    ],
    [
        "Try to convince your conversation partner that traditions are vital.",
        "Try to convince your conversation partner that progress is vital."
    ],
    [
        "You are arguing that climate change is man-made.",
        "You are arguing that climate changes follow natural cycles."
    ],
    [
        "You are arguing that Australia needs to protect its identity.",
        "You are arguing that Australia should welcome more immigration."
    ],
    [
        "You are arguing that social media has connected the world.",
        "You are arguing that social media brings more harm than good."
    ],
    [
        "Try to convince your conversation partner that cellphones should be banned in schools.",
        "You are arguing that cellphones should be integrated into classroom teaching."
    ]
]

Topics[QUESTION.TYPE.QUEST] = [...Topics[QUESTION.TYPE.QUEST_CATEGORIES][QUESTION.CATEGORY.MATURE], ...Topics[QUESTION.TYPE.QUEST_CATEGORIES][QUESTION.CATEGORY.GENERAL]]
Topics[QUESTION.TYPE.ICEBREAKER] = [
    "Describe your current mood with one word.",
    "What animal would you be and why?",
    "Describe the shape of a wish.",
    "What is the colour of today?",
    "Describe how happiness would taste.",
    "If you could have any superpower, what would you choose and why?",
    "If you could be in the movie of your choice, what movie would it be? Why?",
    "Describe yourself in one word.",
    "Describe how happiness would smell.",
    "Describe your life in one word.",
    "Are you sunrise, daylight, twilight, or night? Why?",
    "Describe your favourite city in one word.",
    "Describe the past week in one word.",
    "Describe your family in one word.",
    "What's your most irrational fear?",
    "What's an unusual skill you have?",
    "Which emoji do you use the most?",
    "What would you do if you had an extra hour in the day?"
]

export default Topics;
// module.exports = { Topics }