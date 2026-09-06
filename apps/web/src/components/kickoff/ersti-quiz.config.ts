// cspell:disable
export interface WeightedMatch {
  team: string;
  points: number;
}

export interface ErstiQuizAnswer {
  id: string;
  text: string;
  matches: WeightedMatch[];
}

export interface ErstiQuizQuestion {
  kicker: string;
  context?: string;
  question: string;
  answers: ErstiQuizAnswer[];
}

export interface ErstiQuizResult {
  team: string;
  lead: string;
  description: string;
  notionHref?: string;
}

export interface StudyProgram {
  label: string;
  aliases: string[];
}

export interface StudyStep {
  kicker: string;
  question: string;
  helper: string;
  placeholder: string;
}

export const TEAM_ORDER = [
  "Corporate",
  "Startup & Venture Capital",
  "Speaker",
  "Growth & Partnerships",
  "Marketing",
  "Participant Relations",
  "Concept",
  "On Conference",
  "Hackathon",
  "Female Founders",
  "IT",
  "Human Capital & Foreign Relations",
] as const;

export const ERSTI_QUIZ_QUESTIONS: ErstiQuizQuestion[] = [
  {
    kicker: "Welcome to Q",
    context:
      "Q is much more than the two conference days. Throughout the year, our teams build partnerships, create events and journeys, develop digital products, produce content and shape the community. In the end, everything comes together at the Q Summit.",
    question:
      "Which part of that journey sounds most exciting to you at first?",
    answers: [
      {
        id: "A",
        text: "Building the network behind Q by working with companies, startups, investors, universities and other organizations.",
        matches: [
          {
            team: "Corporate",
            points: 3,
          },
          {
            team: "Startup & Venture Capital",
            points: 3,
          },
          {
            team: "Growth & Partnerships",
            points: 3,
          },
        ],
      },
      {
        id: "B",
        text: "Bringing inspiring people and role models to Q and creating formats where their ideas and stories can inspire others.",
        matches: [
          {
            team: "Speaker",
            points: 3,
          },
          {
            team: "Female Founders",
            points: 3,
          },
        ],
      },
      {
        id: "C",
        text: "Shaping how Q looks and feels through creative content, spaces, decoration and memorable conference experiences.",
        matches: [
          {
            team: "Marketing",
            points: 3,
          },
          {
            team: "Concept",
            points: 3,
          },
          {
            team: "On Conference",
            points: 3,
          },
        ],
      },
      {
        id: "D",
        text: "Making sure people feel welcome at Q and building a community that stays connected throughout the entire year.",
        matches: [
          {
            team: "Participant Relations",
            points: 3,
          },
          {
            team: "Human Capital & Foreign Relations",
            points: 3,
          },
        ],
      },
      {
        id: "E",
        text: "Building the digital side of Q and creating innovative formats where technology, ideas and people come together.",
        matches: [
          {
            team: "IT",
            points: 3,
          },
          {
            team: "Hackathon",
            points: 3,
          },
        ],
      },
    ],
  },
  {
    kicker: "Q throughout the year",
    context:
      "Before the conference even starts, Q already has a full calendar. There are journeys, socials, Road2Q events, office visits, workshops, community formats and plenty of content created around them.",
    question:
      "Which kind of experience would you most enjoy helping to create during the year?",
    answers: [
      {
        id: "A",
        text: "Journeys, socials and coffee dates that help Q ties get to know each other and turn the initiative into a close community.",
        matches: [
          {
            team: "Human Capital & Foreign Relations",
            points: 5,
          },
        ],
      },
      {
        id: "B",
        text: "Road2Q events and collaborations with top universities, media and entrepreneurship institutions that make Q visible beyond Mannheim.",
        matches: [
          {
            team: "Growth & Partnerships",
            points: 5,
          },
        ],
      },
      {
        id: "C",
        text: "Startup crawls, office visits and journeys where you can meet founders, startups and investors and discover their ecosystem.",
        matches: [
          {
            team: "Startup & Venture Capital",
            points: 4,
          },
        ],
      },
      {
        id: "D",
        text: "Workshops, dinners and other formats that connect students with inspiring female founders and strengthen female entrepreneurship.",
        matches: [
          {
            team: "Female Founders",
            points: 4,
          },
        ],
      },
      {
        id: "E",
        text: "Capturing events and journeys through photos, videos, stories and social content so that people can experience Q online as well.",
        matches: [
          {
            team: "Marketing",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "The network behind Q",
    context:
      "A large part of Q is about bringing the right people together. Different teams build very different relationships around the conference.",
    question:
      "Which kind of connection would you be most interested in building?",
    answers: [
      {
        id: "A",
        text: "Leading companies that could become long term Q partners, including calls, pitches, sponsorships and negotiations.",
        matches: [
          {
            team: "Corporate",
            points: 5,
          },
        ],
      },
      {
        id: "B",
        text: "Startup founders and investors who can contribute workshops, panels, interviews and other formats to Q.",
        matches: [
          {
            team: "Startup & Venture Capital",
            points: 5,
          },
        ],
      },
      {
        id: "C",
        text: "Inspiring personalities who could appear on the Main Stage, from finding and contacting them to personally accompanying them at Q.",
        matches: [
          {
            team: "Speaker",
            points: 5,
          },
        ],
      },
      {
        id: "D",
        text: "Media, top universities and entrepreneurship institutions that could help Q reach new communities and build new collaborations.",
        matches: [
          {
            team: "Growth & Partnerships",
            points: 4,
          },
        ],
      },
      {
        id: "E",
        text: "Partners that directly shape an experience at Q, such as Food and Beverage brands, Goodie Bag partners, furniture and decoration partners or Hackathon challenge partners.",
        matches: [
          {
            team: "Participant Relations",
            points: 4,
          },
          {
            team: "On Conference",
            points: 4,
          },
          {
            team: "Concept",
            points: 4,
          },
          {
            team: "Hackathon",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "When Q takes over the Schloss",
    context:
      "After months of preparation, Q finally takes over the Schloss. Thousands of small decisions suddenly become a real conference experience.",
    question: "Which part of the conference would you most like to shape?",
    answers: [
      {
        id: "A",
        text: "The physical conference itself, including spaces, stands, furniture, decoration, entertainment and the concepts that bring everything together.",
        matches: [
          {
            team: "Concept",
            points: 5,
          },
        ],
      },
      {
        id: "B",
        text: "Food and Beverage, the themed evening and the Afterparty, including catering, drinks, music, decoration and event partners.",
        matches: [
          {
            team: "On Conference",
            points: 5,
          },
        ],
      },
      {
        id: "C",
        text: "The complete participant journey, including ticketing, pricing, accommodation, communication, Check in and the Goodie Bag.",
        matches: [
          {
            team: "Participant Relations",
            points: 5,
          },
        ],
      },
      {
        id: "D",
        text: "A Hackathon with more than 200 participants where teams solve real partner challenges and technology, creativity and business come together.",
        matches: [
          {
            team: "Hackathon",
            points: 5,
          },
        ],
      },
      {
        id: "E",
        text: "The digital infrastructure behind Q, including the Conference App, website and tools that participants, partners and the Q team use.",
        matches: [
          {
            team: "IT",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "Build something of your own",
    question:
      "If you could take ownership of one idea and turn it into something real, what would you choose?",
    answers: [
      {
        id: "A",
        text: "A campaign, Reel, photo shoot or new piece of Merch that shapes how people see Q.",
        matches: [
          {
            team: "Marketing",
            points: 5,
          },
        ],
      },
      {
        id: "B",
        text: "A new website or app feature, an automation or another digital solution that makes something at Q work better.",
        matches: [
          {
            team: "IT",
            points: 5,
          },
        ],
      },
      {
        id: "C",
        text: "A new live experience, space or challenge format that people can actually interact with at Q.",
        matches: [
          {
            team: "Concept",
            points: 4,
          },
          {
            team: "Hackathon",
            points: 4,
          },
        ],
      },
      {
        id: "D",
        text: "A new workshop or event that gives female founders visibility, connects people and creates real empowerment.",
        matches: [
          {
            team: "Female Founders",
            points: 5,
          },
        ],
      },
      {
        id: "E",
        text: "A new social, journey or Q tradition that helps people meet each other and creates memories throughout the year.",
        matches: [
          {
            team: "Human Capital & Foreign Relations",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "Conversations you would enjoy",
    question:
      "Which type of conversation would you most enjoy becoming really good at?",
    answers: [
      {
        id: "A",
        text: "Explaining Q to a large company and negotiating a partnership that creates value for both sides.",
        matches: [
          {
            team: "Corporate",
            points: 4,
          },
        ],
      },
      {
        id: "B",
        text: "Finding an interesting personality, getting them excited about Q and personally accompanying them through the process.",
        matches: [
          {
            team: "Speaker",
            points: 4,
          },
        ],
      },
      {
        id: "C",
        text: "Talking with startup founders and investors about their businesses and developing a partnership or format together.",
        matches: [
          {
            team: "Startup & Venture Capital",
            points: 4,
          },
        ],
      },
      {
        id: "D",
        text: "Approaching universities, media and institutions and turning a first contact into a new collaboration or event.",
        matches: [
          {
            team: "Growth & Partnerships",
            points: 4,
          },
        ],
      },
      {
        id: "E",
        text: "Talking directly with participants while also coordinating brands and partners that improve their experience at Q.",
        matches: [
          {
            team: "Participant Relations",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "Skills you want to build",
    question:
      "Which combination of skills would you most like to develop at Q?",
    answers: [
      {
        id: "A",
        text: "Planning and coordinating events while thinking about spaces, logistics, catering and the overall experience.",
        matches: [
          {
            team: "Concept",
            points: 4,
          },
          {
            team: "On Conference",
            points: 4,
          },
        ],
      },
      {
        id: "B",
        text: "Creating digital experiences by combining technology, design and communication across websites, apps and online content.",
        matches: [
          {
            team: "IT",
            points: 4,
          },
          {
            team: "Marketing",
            points: 4,
          },
        ],
      },
      {
        id: "C",
        text: "Professional outreach, pitching and negotiation with companies, startups and investors.",
        matches: [
          {
            team: "Corporate",
            points: 4,
          },
          {
            team: "Startup & Venture Capital",
            points: 4,
          },
        ],
      },
      {
        id: "D",
        text: "Researching interesting opportunities, building networks and communicating professionally to turn a first idea into a collaboration.",
        matches: [
          {
            team: "Growth & Partnerships",
            points: 4,
          },
          {
            team: "Speaker",
            points: 4,
          },
        ],
      },
      {
        id: "E",
        text: "Bringing people together through community events and meaningful formats that help people connect, grow and feel part of something.",
        matches: [
          {
            team: "Human Capital & Foreign Relations",
            points: 4,
          },
          {
            team: "Female Founders",
            points: 4,
          },
        ],
      },
    ],
  },
  {
    kicker: "What sounds most like you?",
    question: "Which statement feels most like you?",
    answers: [
      {
        id: "A",
        text: "I love creating experiences where people feel welcome and remember the atmosphere long after the event is over.",
        matches: [
          {
            team: "Participant Relations",
            points: 4,
          },
          {
            team: "On Conference",
            points: 4,
          },
        ],
      },
      {
        id: "B",
        text: "I am naturally curious about technology, innovation and finding new ways to solve problems.",
        matches: [
          {
            team: "IT",
            points: 4,
          },
          {
            team: "Hackathon",
            points: 4,
          },
        ],
      },
      {
        id: "C",
        text: "I enjoy telling strong stories and giving inspiring people and role models a platform.",
        matches: [
          {
            team: "Speaker",
            points: 4,
          },
          {
            team: "Female Founders",
            points: 4,
          },
          {
            team: "Marketing",
            points: 4,
          },
        ],
      },
      {
        id: "D",
        text: "I enjoy representing a project confidently, building professional relationships and creating opportunities through partnerships.",
        matches: [
          {
            team: "Corporate",
            points: 4,
          },
        ],
      },
      {
        id: "E",
        text: "I care most about creating a close community where people meet, travel together and build memories beyond the actual work.",
        matches: [
          {
            team: "Human Capital & Foreign Relations",
            points: 4,
          },
        ],
      },
    ],
  },
];

export const STUDY_STEP: StudyStep = {
  kicker: "One last thing",
  question: "What do you study?",
  helper:
    "Your degree does not influence your match. We are simply curious where our future Q ties come from.",
  placeholder: "Search your study program",
};

export const ERSTI_QUIZ_RESULTS: ErstiQuizResult[] = [
  {
    team: "Corporate",
    lead: "Business, communication and partnerships sound like your thing.",
    description:
      "At Corporate you acquire company partners, pitch Q, negotiate sponsorships and manage long term relationships with leading companies.",
  },
  {
    team: "Startup & Venture Capital",
    lead: "The startup and investment world genuinely interests you.",
    description:
      "You work directly with founders and VCs, acquire partners for workshops, panels and other formats and help bring the startup ecosystem to Q.",
  },
  {
    team: "Speaker",
    lead: "You are curious about interesting people and the stories behind them.",
    description:
      "You find and approach potential speakers, help shape the Main Stage lineup and accompany speakers from the first contact to their appearance at Q.",
  },
  {
    team: "Growth & Partnerships",
    lead: "You like thinking about how an organization can grow beyond its current network.",
    description:
      "You work with top universities, media and entrepreneurship institutions, develop partnerships and help create Road2Q events.",
  },
  {
    team: "Marketing",
    lead: "You want to shape how Q looks, feels and communicates.",
    description:
      "You create social content, photos and videos, follow trends, design Merch and help tell the Q story across Instagram, TikTok, LinkedIn and our events.",
  },
  {
    team: "Participant Relations",
    lead: "You naturally think about the experience from the participant perspective.",
    description:
      "You work on ticketing, pricing, accommodation, communication, Check in and Goodie Bags and help make the entire participant journey feel seamless.",
  },
  {
    team: "Concept",
    lead: "You want to turn ideas into things people can actually see and experience.",
    description:
      "You shape the physical Q through spaces, furniture, decoration, entertainment, logistics and creative conference concepts.",
  },
  {
    team: "On Conference",
    lead: "You care about atmosphere and the moments that make an event memorable.",
    description:
      "You shape Food and Beverage, catering, the themed evening, the Afterparty and the partners, music and details behind those experiences.",
  },
  {
    team: "Hackathon",
    lead: "You like innovation and the idea of building an entire event around new solutions.",
    description:
      "You help organize our 200 plus participant Hackathon across partner challenges, growth, marketing, participant experience and event organization.",
  },
  {
    team: "Female Founders",
    lead: "You want to create meaningful formats around female entrepreneurship.",
    description:
      "You work with inspiring female founders, organize workshops and events and help build a new team with real room for your own ideas.",
  },
  {
    team: "IT",
    lead: "You enjoy understanding how digital products work and making them better.",
    description:
      "You can work on the Q website, Conference App, internal tools and automation while learning about development, APIs, data and digital products.",
  },
  {
    team: "Human Capital & Foreign Relations",
    lead: "For you, a great initiative is also about the people and memories behind it.",
    description:
      "You create the community around Q through journeys, socials, Coffee Dates and shared experiences that turn 120 individual members into the Q Family.",
  },
];

export const STUDY_PROGRAMS: StudyProgram[] = [
  {
    label: "Bachelor Betriebswirtschaftslehre",
    aliases: ["BWL", "Business Administration"],
  },
  {
    label: "Bachelor Current English Linguistics and Literary Studies",
    aliases: ["CELLS", "English Linguistics"],
  },
  {
    label: "Bachelor Germanistik: Sprache, Literatur, Medien",
    aliases: ["Germanistik"],
  },
  {
    label: "Bachelor Geschichte",
    aliases: ["Geschichte", "History"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft",
    aliases: ["KuWi", "Kultur Wirtschaft"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Anglistik/Amerikanistik",
    aliases: ["KuWi Anglistik", "KuWi Amerikanistik"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Germanistik",
    aliases: ["KuWi Germanistik"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Geschichte",
    aliases: ["KuWi Geschichte"],
  },
  {
    label:
      "Bachelor Kultur und Wirtschaft: Medien- und Kommunikationswissenschaft",
    aliases: ["KuWi MKW", "KuWi Medien"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Philosophie",
    aliases: ["KuWi Philosophie"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Romanistik - Französisch",
    aliases: ["KuWi Französisch", "KuWi Franzoesisch"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Romanistik - Italienisch",
    aliases: ["KuWi Italienisch"],
  },
  {
    label: "Bachelor Kultur und Wirtschaft: Romanistik - Spanisch",
    aliases: ["KuWi Spanisch"],
  },
  {
    label: "Bachelor Lehramt Gymnasium: Bildende Kunst",
    aliases: ["Lehramt Kunst", "Kunst"],
  },
  {
    label: "Bachelor Lehramt Gymnasium: Musik",
    aliases: ["Lehramt Musik", "Musik"],
  },
  {
    label: "Bachelor Medien- und Kommunikationswissenschaft",
    aliases: ["MKW", "Medien Kommunikationswissenschaft"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium",
    aliases: ["BEd", "Lehramt"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Deutsch",
    aliases: ["Lehramt Deutsch"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Englisch",
    aliases: ["Lehramt Englisch"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Französisch",
    aliases: ["Lehramt Französisch", "Lehramt Franzoesisch"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Geschichte",
    aliases: ["Lehramt Geschichte"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Informatik",
    aliases: ["Lehramt Informatik"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Italienisch",
    aliases: ["Lehramt Italienisch"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Mathematik",
    aliases: ["Lehramt Mathe", "Lehramt Mathematik"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Philosophie/Ethik",
    aliases: ["Lehramt Philosophie", "Lehramt Ethik"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Politikwissenschaft",
    aliases: ["Lehramt Politik", "Lehramt PoWi"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Spanisch",
    aliases: ["Lehramt Spanisch"],
  },
  {
    label: "Bachelor of Education Lehramt Gymnasium: Wirtschaftswissenschaft",
    aliases: ["Lehramt Wirtschaft", "Lehramt WiWi"],
  },
  {
    label: "Bachelor Politikwissenschaft",
    aliases: ["PoWi", "PolWi", "Political Science"],
  },
  {
    label: "Bachelor Psychologie",
    aliases: ["Psychologie", "Psychology"],
  },
  {
    label: "Bachelor Romanische Sprachen, Literaturen und Medien",
    aliases: ["Romanistik"],
  },
  {
    label: "Bachelor Soziologie",
    aliases: ["Soziologie", "Sociology"],
  },
  {
    label: "Bachelor Volkswirtschaftslehre",
    aliases: ["VWL", "Economics"],
  },
  {
    label: "Bachelor Wirtschaftsinformatik",
    aliases: ["WInfo", "WiFo", "Wirtschaftsinformatik", "Business Informatics"],
  },
  {
    label: "Bachelor Wirtschaftsmathematik",
    aliases: ["WiMa", "Wirtschaftsmathematik"],
  },
  {
    label: "Bachelor Wirtschaftspädagogik",
    aliases: ["WiPäd", "WiPaed", "Wirtschaftspädagogik"],
  },
  {
    label: "Kombinationsstudiengang Unternehmensjurist/in (LL.B./Staatsexamen)",
    aliases: ["Unternehmensjurist", "Jura", "LLB", "Staatsexamen"],
  },
  {
    label: "Mannheim Master in Data Science",
    aliases: ["MMDS", "Data Science"],
  },
  {
    label: "Mannheim Master in Finance, Accounting and Taxation",
    aliases: ["Finance Accounting Taxation", "FinAccTax"],
  },
  {
    label: "Mannheim Master in Management",
    aliases: ["MMM", "Management"],
  },
  {
    label: "Mannheim Master in Operations and Supply Chain Management",
    aliases: ["MOSCM", "Operations", "Supply Chain"],
  },
  {
    label: "Mannheim Master in Social Data Science",
    aliases: ["Social Data Science", "MSDS"],
  },
  {
    label: "Master Geschichte",
    aliases: ["Master History"],
  },
  {
    label: "Master Intercultural German Studies",
    aliases: ["Intercultural German Studies"],
  },
  {
    label: "Master Klinische Psychologie und Psychotherapie",
    aliases: ["Klinische Psychologie", "Psychotherapie"],
  },
  {
    label: "Master Kultur und Wirtschaft",
    aliases: ["Master KuWi"],
  },
  {
    label: "Master Kultur und Wirtschaft: Anglistik/Amerikanistik",
    aliases: ["Master KuWi Anglistik", "Master KuWi Amerikanistik"],
  },
  {
    label: "Master Kultur und Wirtschaft: Französistik",
    aliases: ["Master KuWi Französisch", "Master KuWi Franzoesisch"],
  },
  {
    label: "Master Kultur und Wirtschaft: Germanistik",
    aliases: ["Master KuWi Germanistik"],
  },
  {
    label: "Master Kultur und Wirtschaft: Geschichte",
    aliases: ["Master KuWi Geschichte"],
  },
  {
    label: "Master Kultur und Wirtschaft: Hispanistik",
    aliases: ["Master KuWi Spanisch", "Hispanistik"],
  },
  {
    label: "Master Kultur und Wirtschaft: Italianistik",
    aliases: ["Master KuWi Italienisch"],
  },
  {
    label:
      "Master Kultur und Wirtschaft: Medien- und Kommunikationswissenschaft",
    aliases: ["Master KuWi MKW", "Master KuWi Medien"],
  },
  {
    label: "Master Kultur und Wirtschaft: Philosophie",
    aliases: ["Master KuWi Philosophie"],
  },
  {
    label: "Master Literatur, Medien und Kultur der Moderne",
    aliases: ["LMKM", "Literatur Medien Kultur"],
  },
  {
    label: "Master Mathematik",
    aliases: ["Mathematik", "Math"],
  },
  {
    label:
      "Master Medien- und Kommunikationswissenschaft: Digitale Kommunikation",
    aliases: ["MKW Digitale Kommunikation", "Digitale Kommunikation"],
  },
  {
    label: "Master of Comparative Business Law",
    aliases: ["MCBL", "Comparative Business Law"],
  },
  {
    label: "Master of Education Lehramt Gymnasium",
    aliases: ["MEd", "Master Lehramt"],
  },
  {
    label: "Master of Education Erweiterungsfach Lehramt Gymnasium",
    aliases: ["MEd Erweiterungsfach", "Erweiterungsfach"],
  },
  {
    label: "Master of Laws (LL.M.)",
    aliases: ["LLM", "Master Jura"],
  },
  {
    label: "Master Political Science",
    aliases: ["Political Science", "PoWi Master", "PolWi Master"],
  },
  {
    label: "Master Psychologie (Arbeit, Wirtschaft und Gesellschaft)",
    aliases: ["Psychologie AWG", "AWG"],
  },
  {
    label: "Master Sociology",
    aliases: ["Sociology", "Soziologie Master"],
  },
  {
    label: "Master Sprache und Kommunikation",
    aliases: ["Sprache Kommunikation"],
  },
  {
    label: "Master Volkswirtschaftslehre",
    aliases: ["VWL Master", "Economics Master"],
  },
  {
    label: "Master Wettbewerbs- und Regulierungsrecht (LL.M.)",
    aliases: ["Wettbewerbsrecht", "Regulierungsrecht", "LLM"],
  },
  {
    label: "Master Wirtschaftsinformatik",
    aliases: [
      "WInfo Master",
      "WiFo Master",
      "Wirtschaftsinformatik Master",
      "Business Informatics Master",
    ],
  },
  {
    label: "Master Wirtschaftsmathematik",
    aliases: ["WiMa Master", "Wirtschaftsmathematik Master"],
  },
  {
    label: "Master Wirtschaftspädagogik",
    aliases: ["WiPäd Master", "WiPaed Master", "Wirtschaftspädagogik Master"],
  },
  {
    label: "MBS: ESSEC & MANNHEIM Executive MBA (Part-Time)",
    aliases: ["ESSEC Mannheim Executive MBA", "EMBA"],
  },
  {
    label: "MBS: Mannheim Executive MBA (Part-Time)",
    aliases: ["Mannheim Executive MBA", "EMBA"],
  },
  {
    label: "MBS: Mannheim Full-Time MBA",
    aliases: ["Mannheim MBA", "MBA"],
  },
  {
    label: "MBS: Mannheim Master in Management Analytics & AI (Part-Time)",
    aliases: ["Management Analytics AI", "Analytics AI"],
  },
  {
    label:
      "MBS: Mannheim Master in Sustainable Business & Technology (Part-Time)",
    aliases: ["Sustainable Business Technology"],
  },
  {
    label:
      "MBS: Mannheim Master of Accounting & Taxation - Mannheim Master of Accounting (Part-Time)",
    aliases: ["Master Accounting", "Accounting Taxation"],
  },
  {
    label:
      "MBS: Mannheim Master of Accounting & Taxation - Mannheim Master of Taxation (Part-Time)",
    aliases: ["Master Taxation", "Accounting Taxation"],
  },
  {
    label: "MBS: Mannheim Part-Time MBA",
    aliases: ["Part Time MBA", "MBA"],
  },
];
