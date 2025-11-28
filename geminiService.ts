
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

// Liste de thèmes pour assurer la diversité et l'effet "millions de questions"
const SUB_TOPICS = [
    "Les Prophètes (Adam, Nuh, Ibrahim, Moussa, Issa)",
    "La vie du Prophète Muhammad (Sâw) - Période Mecquoise",
    "La vie du Prophète Muhammad (Sâw) - Période Médinoise",
    "Les Compagnons (Sahaba) et leurs mérites",
    "Les Mères des Croyants (épouses du Prophète)",
    "Le Saint Coran (Révélation, Sourates, Versets spécifiques)",
    "Le Tafsir (Exégèse) et le contexte de révélation",
    "Les Hadiths (Bukhari, Muslim, Tirmidhi...)",
    "Le Fiqh de la Prière (Salat) et ses conditions",
    "Le Fiqh du Jeûne (Ramadan) et de la rupture",
    "Le Fiqh de la Zakat et de l'Aumône",
    "Le Hajj et la Omra (Rites et Lieux)",
    "Les Batailles de l'Islam (Badr, Uhud, Khandaq, Tabuk)",
    "L'Histoire des Califes Bien Guidés (Abu Bakr, Umar, Uthman, Ali)",
    "La Croyance (Aqida), le Tawhid et les Noms d'Allah",
    "Les Signes de la Fin des Temps (Mineurs et Majeurs)",
    "L'Éthique, le Comportement (Adab) et les droits du voisin",
    "Les Femmes pieuses de l'Histoire (Maryam, Asiya, Khadija, Aisha)",
    "La Science du Hadith (Isnad, Matn)",
    "L'histoire de l'Andalousie et la civilisation islamique"
];

export const generateQuestions = async (count: number = 6, difficulty: Difficulty = 'ADAPTIVE'): Promise<Question[]> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock data.");
    return mockQuestions.slice(0, count);
  }

  try {
    let difficultyPrompt = "";
    
    switch(difficulty) {
        case 'EASY':
            difficultyPrompt = "NIVEAU: DÉBUTANT (Facile). Questions sur les bases fondamentales accessibles à tous.";
            break;
        case 'MEDIUM':
            difficultyPrompt = "NIVEAU: INTERMÉDIAIRE. Questions demandant de la réflexion et une connaissance générale.";
            break;
        case 'HARD':
            difficultyPrompt = "NIVEAU: AVANCÉ. Questions difficiles sur des détails précis (dates, noms, règles spécifiques).";
            break;
        case 'EXPERT':
            difficultyPrompt = "NIVEAU: EXPERT / SAVANT. Questions très pointues, rares ou académiques.";
            break;
        case 'ADAPTIVE':
        default:
            difficultyPrompt = `
                NIVEAU PROGRESSIF (ADAPTIVE):
                - Question 1-2 : NIVEAU FACILE (Culture générale)
                - Question 3-4 : NIVEAU MOYEN (Détails historiques ou Fiqh de base)
                - Question 5 : NIVEAU DIFFICILE (Précision requise)
                - Question 6 : NIVEAU EXPERT (Détail subtil ou méconnu)
                Simule une augmentation de la difficulté pour challenger le candidat.
            `;
            break;
    }

    // Sélectionner 3 thèmes aléatoires pour ce lot de questions
    // Cela garantit que chaque quiz est unique, simulant une base de "millions de questions".
    const shuffledTopics = [...SUB_TOPICS].sort(() => 0.5 - Math.random());
    const selectedTopics = shuffledTopics.slice(0, 3).join(', ');

    const prompt = `
      Agis comme un grand savant et pédagogue en sciences islamiques.
      Génère ${count} questions à choix multiples (QCM) sur l'Islam en français.
      
      ${difficultyPrompt}
      
      DIVERSITÉ ET ORIGINALITÉ (Mode "Millions de Questions") :
      1. Pour ce quiz, inclus impérativement des questions liées à ces thèmes aléatoires : [${selectedTopics}].
      2. Pour le reste, varie les sujets.
      3. ÉVITE les questions trop répétitives (ex: "Combien de piliers a l'Islam") sauf si le niveau est DÉBUTANT.
      4. Sois créatif : interroge sur des événements, des sagesses, des contextes, pas juste des chiffres.
      
      Format attendu : JSON uniquement.
      Les questions doivent être basées sur des sources authentiques (Coran et Sounnah).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "La question posée" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "4 choix de réponse"
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "L'index de la bonne réponse (0-3)" },
              explanation: { type: Type.STRING, description: "Une explication détaillée et pédagogique de la réponse (avec preuve si possible)" },
              difficulty: { type: Type.STRING, description: "EASY, MEDIUM, HARD, ou EXPERT" }
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation", "difficulty"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA");
    
    const questions = JSON.parse(text) as Question[];
    
    // Add 'source' tag
    return questions.map(q => ({ ...q, source: 'AI' }));

  } catch (error) {
    console.error("Erreur lors de la génération des questions:", error);
    // En cas d'erreur, on retourne un mix des questions mockées
    return mockQuestions.sort(() => 0.5 - Math.random()).slice(0, count);
  }
};

const mockQuestions: Question[] = [

  {
    "questionText": "Quel compagnon est connu pour sa générosité extrême, au point que le Prophète ﷺ a dit que même une montagne d’or ne l’aurait pas enrichi ?",
    "options": ["Uthman ibn Affan", "Abdurrahman ibn Awf", "Abu Bakr", "Talha ibn Ubaydillah"],
    "correctAnswerIndex": 1,
    "explanation": "Abdurrahman ibn Awf (ra) était connu pour ses dons immenses au service de l’Islam.",
    "difficulty": "MEDIUM",
    "source": "MANUAL"
  },
  {
    "questionText": "Quel prophète a obtenu de Dieu la capacité de comprendre le langage des animaux et des vents ?",
    "options": ["Sulaymân عليه السلام", "Mûsâ عليه السلام", "Nûh عليه السلام", "Ibrahim عليه السلام"],
    "correctAnswerIndex": 0,
    "explanation": "Sulaymân عليه السلام a reçu de nombreux miracles dont la compréhension du langage animal.",
    "difficulty": "MEDIUM",
    "source": "MANUAL"
  },
  {
    "questionText": "Quel calife a institué l’usage du calendrier hégirien ?",
    "options": ["Abu Bakr", "Umar ibn al-Khattab", "Uthman ibn Affan", "Ali ibn Abi Talib"],
    "correctAnswerIndex": 1,
    "explanation": "Le califat de Umar (ra) institua le calendrier basé sur l’Hégire.",
    "difficulty": "HARD",
    "source": "MANUAL"
  },
  {
    "questionText": "Quel compagnon était réputé pour la force de sa mémoire et la précision de sa transmission des hadiths ?",
    "options": ["Abu Hurayra", "Ibn Abbas", "Ibn Masud", "Jabir ibn Abdullah"],
    "correctAnswerIndex": 0,
    "explanation": "Abu Hurayra (ra) est le compagnon ayant transmis le plus grand nombre de hadiths.",
    "difficulty": "MEDIUM",
    "source": "MANUAL"
  },
  {
    "questionText": "Quel prophète a reçu les Tables contenant les Commandements divins ?",
    "options": ["Harun عليه السلام", "Mûsâ عليه السلام", "Daoud عليه السلام", "Isa عليه السلام"],
    "correctAnswerIndex": 1,
    "explanation": "Mûsâ عليه السلام reçut les Tables sur le mont Sinaï.",
    "difficulty": "EASY",
    "source": "MANUAL"
  },

  {
    "questionText": "Quel compagnon a été choisi pour appeler à la prière le jour de la conquête de La Mecque ?",
    "options": ["Bilal ibn Rabah", "Abu Musa al-Ash’ari", "Sa'd ibn Abi Waqqas", "Anas ibn Malik"],
    "correctAnswerIndex": 0,
    "explanation": "Bilal (ra) fut honoré en montant sur la Kaaba pour appeler à la prière.",
    "difficulty": "MEDIUM",
    "source": "MANUAL"
  },

  {
    "questionText": "Quel prophète fut avalé par un grand poisson avant d’être sauvé ?",
    "options": ["Yûnus عليه السلام", "Lut عليه السلام", "Ayyub عليه السلام", "Saleh عليه السلام"],
    "correctAnswerIndex": 0,
    "explanation": "Yûnus عليه السلام fut avalé par un grand poisson après avoir quitté son peuple.",
    "difficulty": "EASY",
    "source": "MANUAL"
  },

  {
    "questionText": "Quelle bataille marqua la première grande victoire militaire des musulmans ?",
    "options": ["Uhud", "Badr", "Tabuk", "Khandaq"],
    "correctAnswerIndex": 1},
  {
    "questionText": "Quel calife fut surnommé 'Dhul-Nurayn' (le Possesseur des deux lumières) ?",
    "options": ["Abu Bakr", "Umar", "Uthman", "Ali"],
    "correctAnswerIndex": 2
  },

  {
    "questionText": "Quel prophète a été éprouvé par la perte de ses biens, de sa santé et de sa famille mais n’a jamais cessé de patienter ?",
    "options": ["Ayyub عليه السلام", "Harun عليه السلام", "Dâwud عليه السلام", "Nûh عليه السلام"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel compagnon était le porte-étendard des musulmans à Badr ?",
    "options": ["Musab ibn Umayr", "Zayd ibn Haritha", "Ali ibn Abi Talib", "Hamza"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel prophète a eu un enfant dans sa vieillesse nommé Yahya ?",
    "options": ["Ibrahim", "Zakariyyâ", "Lut", "Nûh"],
    "correctAnswerIndex": 1
  },

  {
    "questionText": "Quel compagnon est connu pour avoir conseillé fortement Abu Bakr de compiler le Coran ?",
    "options": ["Umar ibn al-Khattab", "Ali", "Ibn Masud", "Abu Ubayda"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel prophète a bâti, avec son fils, les fondations de la Kaaba ?",
    "options": ["Musa", "Ibrahim", "Daoud", "Yaqub"],
    "correctAnswerIndex": 1
  },

  {
    "questionText": "Quelle femme a protégé le Prophète ﷺ durant la lapidation à Taif ?",
    "options": ["Khadija", "Umm Ayman", "Fatima", "Safiyya"],
    "correctAnswerIndex": 1
  },

  {
    "questionText": "Quel compagnon fut le premier jeune à embrasser l’Islam ?",
    "options": ["Ali ibn Abi Talib", "Usama ibn Zayd", "Abdullah ibn Zubayr", "Ibn Abbas"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel prophète est mentionné comme ayant reçu la souveraineté et la sagesse dès son jeune âge ?",
    "options": ["Dawud", "Sulayman", "Yusuf", "Isa"],
    "correctAnswerIndex": 2
  },

  {
    "questionText": "Quel compagnon est célèbre pour avoir transmis les secrets de l’intérieur de la maison prophétique, notamment concernant les adorations ?",
    "options": ["Anas ibn Malik", "Abu Hurayra", "Ibn Umar", "Ibn Abbas"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel prophète a été envoyé au peuple de Madyan ?",
    "options": ["Shuayb", "Hud", "Saleh", "Nuh"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel calife fut le premier à instaurer la prière de Tarawih en groupe ?",
    "options": ["Abu Bakr", "Umar", "Uthman", "Ali"],
    "correctAnswerIndex": 1
  },

  {
    "questionText": "Quel compagnon est célèbre pour sa connaissance du halal et haram, surnommé 'Le Juriste de la Communauté' ?",
    "options": ["Ibn Abbas", "Ibn Masud", "Muadh ibn Jabal", "Zayd ibn Thabit"],
    "correctAnswerIndex": 2
  },

  {
    "questionText": "Quel prophète fut jeté dans le feu sans être brûlé ?",
    "options": ["Ibrahim", "Musa", "Isa", "Harun"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel compagnon mourut en récitant la sourate Al-Baqara lors de la bataille de Yamama ?",
    "options": ["Al-Bara ibn Malik", "Zayd ibn Thabit", "Abu Ubayda", "Thabit ibn Qays"],
    "correctAnswerIndex": 3
  },

  {
    "questionText": "Quel prophète est connu pour avoir façonné un oiseau d’argile et lui avoir donné vie par permission divine ?",
    "options": ["Isa", "Musa", "Sulayman", "Idris"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel compagnon fut surnommé 'Le Sabre Dégainé d’Allah' ?",
    "options": ["Khalid ibn al-Walid", "Zubayr ibn al-Awwam", "Abu Darda", "Talha"],
    "correctAnswerIndex": 0
  },

  {
    "questionText": "Quel prophète est cité pour avoir été injustement jeté en prison avant de devenir un dirigeant ?",
    "options": ["Yusuf", "Ayyub", "Harun", "Lut"],
    "correctAnswerIndex": 0
  }
];
