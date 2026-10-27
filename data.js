window.CEDILLE_DATA = {
  brand: {
    name: "Cedille",
    tagline: "French, daily."
  },
  user: {
    name: "Léa",
    fullName: "Léa Martin",
    level: "B1",
    target: "DELF B1",
    examDate: "2027-06-12",
    dailyGoal: 20
  },
  seed: {
    readiness: 68,
    streak: 6,
    xp: 1240,
    wordsLearned: 184,
    completedLessons: ["cafe"],
    weekly: [true, true, true, true, true, true, false],
    minutesThisWeek: 104,
    skills: { listening: 72, reading: 81, writing: 54, speaking: 60 },
    examHistory: [
      { date: "24 Oct", level: "DELF B1", score: 64, label: "Mixed sprint" },
      { date: "19 Oct", level: "DELF B1", score: 58, label: "Listening focus" }
    ]
  },
  lessons: {
    cafe: {
      id: "cafe",
      title: "Café survival",
      kicker: "Everyday French",
      subtitle: "Order without switching to English.",
      level: "A2-B1",
      minutes: 14,
      xp: 50,
      newWords: 4,
      outcome: "You can order, ask for the bill, and leave politely.",
      parts: [
        {
          type: "vocab",
          eyebrow: "Part 1 · Vocabulary",
          title: "Four words for the counter",
          intro: "Tap the speaker and say each one out loud. French rewards a little courage.",
          words: [
            {
              fr: "un café",
              en: "a coffee",
              example: "Un café, s'il vous plaît.",
              note: "In France, \"un café\" is an espresso unless you ask for \"un café allongé\"."
            },
            {
              fr: "l'addition",
              en: "the bill",
              example: "L'addition, s'il vous plaît.",
              note: "Never \"le check\". The bill is always feminine: l'addition."
            },
            {
              fr: "je voudrais",
              en: "I would like",
              example: "Je voudrais un croissant.",
              note: "Softer and more polite than \"je veux\"."
            },
            {
              fr: "s'il vous plaît",
              en: "please",
              example: "Un thé, s'il vous plaît.",
              note: "Use \"s'il te plaît\" with friends and family."
            }
          ]
        },
        {
          type: "listening",
          eyebrow: "Part 2 · Listening",
          title: "Listen for the total",
          audio: "Bonjour, un café et un croissant, s'il vous plaît. ... Très bien. Ça fait six euros cinquante.",
          prompt: "How much does the order cost?",
          options: ["€5.60", "€6.15", "€6.50"],
          answer: 2,
          explanation: "\"Six euros cinquante\" is €6.50. The café and the croissant together come to six euros fifty."
        },
        {
          type: "quiz",
          eyebrow: "Part 3 · Use it",
          title: "Close the conversation",
          prompt: "You have finished your coffee and want to pay. What do you say?",
          options: [
            "L'addition, s'il vous plaît.",
            "Où est la gare ?",
            "Je ne parle pas français."
          ],
          answer: 0,
          explanation: "\"L'addition, s'il vous plaît\" asks for the bill politely. \"Où est la gare ?\" means \"Where is the station?\""
        }
      ]
    },
    market: {
      id: "market",
      title: "At the market",
      kicker: "Everyday French",
      subtitle: "Buy produce, ask prices, and use partitive articles.",
      level: "B1",
      minutes: 18,
      xp: 60,
      newWords: 4,
      outcome: "You can shop at a French market without rehearsing every sentence first.",
      parts: [
        {
          type: "vocab",
          eyebrow: "Part 1 · Vocabulary",
          title: "Four words for the stall",
          intro: "Say each word out loud, then tap the speaker to check your pronunciation.",
          words: [
            {
              fr: "le marché",
              en: "the market",
              example: "Je vais au marché le samedi matin.",
              note: "\"Au marché\" is the usual way to say \"to the market\"."
            },
            {
              fr: "un kilo",
              en: "a kilo",
              example: "Je voudrais un kilo de tomates.",
              note: "Markets sell by weight. \"Une livre\" is 500 grams, not a pound."
            },
            {
              fr: "combien",
              en: "how much",
              example: "Combien coûtent les pommes ?",
              note: "\"Combien\" can ask about price or quantity."
            },
            {
              fr: "ça fait",
              en: "that comes to",
              example: "Ça fait quatre euros vingt.",
              note: "The market vendor's shorthand for the total."
            }
          ]
        },
        {
          type: "listening",
          eyebrow: "Part 2 · Listening",
          title: "Catch the price",
          audio: "Bonjour, je voudrais un kilo de tomates et deux pommes. ... Très bien. Ça fait quatre euros vingt.",
          prompt: "What is the total?",
          options: ["€2.40", "€4.02", "€4.20"],
          answer: 2,
          explanation: "\"Quatre euros vingt\" is €4.20. The vendor says the total in one breath, so listen for the number before \"euros\"."
        },
        {
          type: "quiz",
          eyebrow: "Part 3 · Use it",
          title: "Complete the order",
          prompt: "Je voudrais ___ kilo de pommes.",
          options: ["un", "une", "des"],
          answer: 0,
          explanation: "\"Kilo\" is masculine, so it takes \"un\". You are asking for one kilo, not an unspecified amount."
        }
      ]
    }
  },
  path: [
    {
      id: "cafe",
      number: "01",
      title: "Café survival",
      subtitle: "Order, pay, and be polite.",
      level: "A2-B1",
      lessons: 4,
      done: 2,
      status: "done",
      lessonId: "cafe"
    },
    {
      id: "market",
      number: "02",
      title: "At the market",
      subtitle: "Buy produce, ask prices, and use partitive articles.",
      level: "B1",
      lessons: 5,
      done: 2,
      status: "current",
      lessonId: "market"
    },
    {
      id: "getting-around",
      number: "03",
      title: "Getting around",
      subtitle: "Directions, transport, and sounding confident when lost.",
      level: "B1",
      lessons: 5,
      done: 0,
      status: "locked"
    },
    {
      id: "work-plans",
      number: "04",
      title: "Work & plans",
      subtitle: "Talk about your week, your goals, and your next move.",
      level: "B1",
      lessons: 5,
      done: 0,
      status: "locked"
    },
    {
      id: "exam-workshop",
      number: "05",
      title: "Exam workshop",
      subtitle: "Timed sections, model answers, and examiner language.",
      level: "B1",
      lessons: 6,
      done: 0,
      status: "locked"
    }
  ],
  exam: {
    duration: 300,
    levels: {
      B1: {
        label: "DELF B1",
        blurb: "Everyday situations, clear opinions, and the language of a confident independent user.",
        questions: [
          {
            section: "Listening",
            audio: "La gare est au bout de la rue, à droite.",
            prompt: "Where is the station?",
            options: [
              "At the end of the street, on the right",
              "Next to the bakery",
              "Behind the town hall"
            ],
            answer: 0,
            explanation: "\"Au bout de la rue, à droite\" means at the end of the street, on the right."
          },
          {
            section: "Reading",
            context: "MUSÉE D'ORSAY\nLe musée est fermé le mardi.\nOuvert du mercredi au dimanche, 10h–18h.",
            prompt: "When is the museum open?",
            options: [
              "Every day except Sunday",
              "Wednesday to Sunday, 10am to 6pm",
              "Only on Tuesday mornings"
            ],
            answer: 1,
            explanation: "The notice says it is closed on Tuesday and open Wednesday to Sunday from 10am to 6pm."
          },
          {
            section: "Language",
            prompt: "Si j'avais le temps, je ___ plus souvent.",
            options: ["viendrai", "viendrais", "venais"],
            answer: 1,
            explanation: "After \"si + imperfect\", use the conditional: \"je viendrais\"."
          },
          {
            section: "Language",
            prompt: "An apartment \"à louer\" is…",
            options: ["for sale", "for rent", "fully furnished"],
            answer: 1,
            explanation: "\"À louer\" means available to rent. \"À vendre\" means for sale."
          },
          {
            section: "Writing",
            prompt: "You are emailing the town hall. Which closing is most appropriate?",
            options: ["Cordialement,", "Bisous,", "À plus,"],
            answer: 0,
            explanation: "\"Cordialement\" is the standard formal closing for an email. The other two are for friends."
          },
          {
            section: "Listening",
            audio: "Bonjour, je voudrais annuler mon rendez-vous de demain, s'il vous plaît.",
            prompt: "What does the speaker want?",
            options: [
              "Move today's appointment",
              "Cancel tomorrow's appointment",
              "Book a new doctor"
            ],
            answer: 1,
            explanation: "\"Annuler mon rendez-vous de demain\" means cancel tomorrow's appointment."
          }
        ]
      },
      B2: {
        label: "DELF B2",
        blurb: "Nuance, argument, and the language of someone who can hold their own.",
        questions: [
          {
            section: "Listening",
            audio: "La réunion est reportée à jeudi, le temps que le rapport soit finalisé.",
            prompt: "Why is the meeting postponed?",
            options: [
              "So the report can be finished",
              "Because Thursday is a holiday",
              "Because a colleague is away"
            ],
            answer: 0,
            explanation: "\"Le temps que le rapport soit finalisé\" gives the reason: the report needs to be finished."
          },
          {
            section: "Reading",
            context: "Les candidats sont priés de déposer leur dossier avant le 15 mars. Aucune candidature tardive ne sera acceptée.",
            prompt: "What is the rule for applications?",
            options: [
              "They must arrive by 15 March",
              "They can arrive after 15 March with a fee",
              "They must be sent on 15 March"
            ],
            answer: 0,
            explanation: "\"Avant le 15 mars\" means before 15 March, and late applications will not be accepted."
          },
          {
            section: "Language",
            prompt: "Il aurait fallu que nous ___ plus tôt.",
            options: ["partions", "partons", "partirons"],
            answer: 0,
            explanation: "\"Il aurait fallu que\" triggers the subjunctive: \"que nous partions\"."
          },
          {
            section: "Language",
            prompt: "A \"propos nuancé\" is…",
            options: ["a blunt remark", "a nuanced remark", "an off-topic comment"],
            answer: 1,
            explanation: "\"Nuancé\" means nuanced or carefully qualified, not blunt."
          },
          {
            section: "Writing",
            prompt: "Which sentence is the most formal way to request information?",
            options: [
              "Je vous serais reconnaissant de bien vouloir me communiquer ces informations.",
              "Tu peux me dire ça ?",
              "J'ai besoin des infos, merci.",
              "Envoyez-moi les documents."
            ],
            answer: 0,
            explanation: "The conditional \"je vous serais reconnaissant\" plus \"bien vouloir\" is the most formal and polite option."
          },
          {
            section: "Listening",
            audio: "Je ne suis pas convaincu que cette solution soit la plus viable.",
            prompt: "What is the speaker's attitude?",
            options: [
              "They strongly support the solution",
              "They are skeptical about the solution",
              "They have not heard the solution"
            ],
            answer: 1,
            explanation: "\"Je ne suis pas convaincu\" signals doubt, and the subjunctive \"soit\" softens the disagreement."
          }
        ]
      }
    }
  },
  placement: {
    intro: "Five questions, about three minutes. We use your answers to suggest a starting level, not to give you a grade.",
    questions: [
      {
        prompt: "You meet your new neighbour's parents. Which greeting fits?",
        options: ["Bonjour, madame. Enchanté.", "Salut, ça va ?", "Coucou !"],
        answer: 0,
        explanation: "\"Bonjour, madame\" is the safe, polite choice with someone you have just met."
      },
      {
        prompt: "Complete the sentence: Hier, j'___ au cinéma.",
        options: ["ai allé", "suis allé", "vais"],
        answer: 1,
        explanation: "\"Aller\" takes \"être\" in the passé composé: je suis allé(e)."
      },
      {
        prompt: "Which sentence is grammatically correct?",
        options: ["Il faut que je pars.", "Il faut que je parte.", "Il faut que je partirai."],
        answer: 1,
        explanation: "\"Il faut que\" requires the subjunctive: que je parte."
      },
      {
        prompt: "You hear: \"Je voudrais réserver une table pour deux.\" What does the speaker want?",
        options: ["To book a table for two", "To order two coffees", "To ask for the bill"],
        answer: 0,
        explanation: "\"Réserver une table pour deux\" means book a table for two."
      },
      {
        prompt: "You disagree in a meeting. Which phrase is the most professional?",
        options: ["Non, c'est faux.", "Je comprends votre point, mais…", "Tu es fou."],
        answer: 1,
        explanation: "Acknowledging the other point before disagreeing is the standard professional register."
      }
    ]
  }
};
