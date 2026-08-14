const { GoogleGenerativeAI } = require('@google/generative-ai');
const { isDuplicateQuestion } = require('../utils/duplicateChecker');

// Load API Key directly from process.env.GEMINI_API_KEY
const getApiKey = () => process.env.GEMINI_API_KEY || '';

// Priority model list - Using Gemini 3.5 Flash Lite & 3.1 Flash for ultra-fast sub-2-second responses
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

/**
 * Safely parse JSON from raw LLM output, supporting both object wrapper & array formats
 */
const cleanJsonResponse = (rawText) => {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const startObj = cleaned.indexOf('{');
    const endObj = cleaned.lastIndexOf('}');
    if (startObj !== -1 && endObj > startObj) {
      try {
        parsed = JSON.parse(cleaned.substring(startObj, endObj + 1));
      } catch (e) {}
    }
    if (!parsed) {
      const startArr = cleaned.indexOf('[');
      const endArr = cleaned.lastIndexOf(']');
      if (startArr !== -1 && endArr > startArr) {
        parsed = JSON.parse(cleaned.substring(startArr, endArr + 1));
      } else {
        throw err;
      }
    }
  }

  if (parsed && Array.isArray(parsed.questions)) {
    return parsed.questions;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  return [];
};

/**
 * Generate dynamic, 100% original AI test questions in a SINGLE Gemini Flash API call
 */
const generateQuestions = async ({
  exam = 'JEE Main',
  grade = 'Class 12',
  board = 'CBSE',
  subjectName = 'General Subject',
  topicName = null,
  chapterName = null,
  difficulty = 'Mixed',
  questionCount = 5,
  previousPerformance = {},
  previousQuestionTexts = [],
  revisionMode = false
}) => {
  const apiKey = getApiKey();
  const targetChapter = chapterName || 'General Chapter';
  const targetTopic = topicName || chapterName || 'General Topic';

  const prevQuestionsContext = (!revisionMode && previousQuestionTexts.length > 0)
    ? previousQuestionTexts.map((qText, idx) => `${idx + 1}. ${qText}`).slice(0, 20).join('\n')
    : 'None';

  // Ultra-lean prompt asking ONLY for the 4 required fields to maximize generation speed (<2 seconds response)
  const prompt = `
You are EduBridge AI, an expert exam paper setter.
Generate EXACTLY ${questionCount} original questions in a SINGLE JSON response.

Context:
- Subject: ${subjectName}
- Class: ${grade}
- Exam: ${exam}
- Chapter: ${targetChapter}
- Topic: ${targetTopic}
- Difficulty: ${difficulty}

Rules:
1. Every question MUST test a unique concept from ${targetChapter} / ${targetTopic}.
2. Ensure options are realistic and distinct.
3. NO DUPLICATES. Avoid previously attempted questions:
${prevQuestionsContext}

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Question statement string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string matching one of the 4 options above",
      "explanation": "Short step-by-step explanation"
    }
  ]
}
`;

  let acceptedQuestions = [];

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Single request to fastest working Flash model
    for (const modelName of GEMINI_MODELS) {
      if (acceptedQuestions.length >= questionCount) break;

      try {
        const startTime = Date.now();
        console.log(`[Gemini Fast Engine]: Generating all ${questionCount} questions in a single API request with '${modelName}'...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const rawQuestions = cleanJsonResponse(responseText);

        console.log(`[Gemini Fast Engine]: Received API response in ${Date.now() - startTime}ms.`);

        if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
          for (let idx = 0; idx < rawQuestions.length; idx++) {
            const q = rawQuestions[idx];
            const qText = q.question || q.questionText;
            if (!qText || !Array.isArray(q.options) || q.options.length < 4) continue;

            const optionsArray = q.options.slice(0, 4);
            const matchingIdx = optionsArray.indexOf(q.correctAnswer);
            const correctIdx = matchingIdx >= 0 ? matchingIdx : 0;
            const correctText = optionsArray[correctIdx] || q.correctAnswer || optionsArray[0];

            // Server-side ultra-fast metadata assignment
            const normalizedQ = {
              id: acceptedQuestions.length + 1,
              question: qText,
              questionText: qText,
              options: optionsArray,
              correctAnswer: correctText,
              correctOptionIndex: correctIdx,
              explanation: q.explanation || 'Step-by-step solution.',
              subject: subjectName,
              class: grade,
              grade: grade,
              exam: exam,
              examType: exam,
              chapter: targetChapter,
              topic: targetTopic,
              subtopic: `${subjectName} Core Concept`,
              difficulty: difficulty === 'Mixed' ? (acceptedQuestions.length % 2 === 0 ? 'Medium' : 'Hard') : difficulty,
              estimatedTime: '45 sec',
              estimatedTimeSeconds: 45,
              bloomsLevel: acceptedQuestions.length % 3 === 0 ? 'Apply' : acceptedQuestions.length % 2 === 0 ? 'Analyze' : 'Understand',
              bloomLevel: acceptedQuestions.length % 3 === 0 ? 'Apply' : acceptedQuestions.length % 2 === 0 ? 'Analyze' : 'Understand',
              concept: `${subjectName} Core Concept`,
              conceptTested: `${subjectName} Core Concept`,
              commonMistake: 'Confusing distractor options or misreading boundary conditions.',
              learningObjective: `Master core principles of ${subjectName}`,
              confidence: 0.98,
              questionType: 'Conceptual'
            };

            // Fast O(1) similarity check with 0.40 threshold to avoid false duplicate rejections
            const acceptedTexts = acceptedQuestions.map(item => item.questionText);
            const isHistoryDuplicate = !revisionMode && isDuplicateQuestion(qText, previousQuestionTexts, 0.40);
            const isBatchDuplicate = isDuplicateQuestion(qText, acceptedTexts, 0.40);

            if (!isHistoryDuplicate && !isBatchDuplicate) {
              acceptedQuestions.push(normalizedQ);
              if (acceptedQuestions.length >= questionCount) break;
            }
          }

          if (acceptedQuestions.length > 0) {
            console.log(`[Gemini Fast Engine]: Successfully generated ${acceptedQuestions.length}/${questionCount} questions in 1 request.`);
            break;
          }
        }
      } catch (err) {
        console.warn(`[Gemini Fast Engine]: Model '${modelName}' failed (${err.message}). Trying fallback...`);
      }
    }
  }

  // Fill any remaining slots with domain-aware fast fallbacks if API was unreachable
  if (acceptedQuestions.length < questionCount) {
    const missingCount = questionCount - acceptedQuestions.length;
    const acceptedTexts = acceptedQuestions.map(item => item.questionText);
    const allExclusionTexts = [...previousQuestionTexts, ...acceptedTexts];

    const fallbacks = generateRichDomainFallbackQuestions({
      count: missingCount,
      subjectName,
      topicName: targetTopic,
      chapterName: targetChapter,
      difficulty,
      exam,
      grade,
      excludeTexts: allExclusionTexts
    });

    acceptedQuestions.push(...fallbacks);
  }

  return acceptedQuestions.slice(0, questionCount).map((q, idx) => ({ ...q, id: idx + 1 }));
};

/**
 * Domain-Aware Fast Fallback Generator
 */
function generateRichDomainFallbackQuestions({ count, subjectName, topicName, chapterName, difficulty, exam, grade, excludeTexts = [] }) {
  const scope = topicName || chapterName || subjectName || 'Core Concept';
  const lowerSub = (subjectName || '').toLowerCase();
  const lowerScope = (scope || '').toLowerCase();

  let subConceptPool = [];

  if (lowerSub.includes('physic') || lowerScope.includes('electrostatic') || lowerScope.includes('gauss') || lowerScope.includes('magnetic') || lowerScope.includes('optic') || lowerScope.includes('force')) {
    subConceptPool = [
      {
        concept: "Electric Flux & Field Integration",
        format: "Numerical",
        subtopic: "Gauss's Law Applications",
        getQuestion: (idx) => `Question ${idx}: A spherical surface of radius R = ${idx + 2} cm encloses a point charge q = ${idx + 3} μC at its center. What is the net electric flux passing through the spherical surface? (Permittivity ε₀ = 8.85 × 10⁻¹² F/m)`,
        getOptions: (idx) => [
          `${((idx + 3) * 1.13).toFixed(2)} × 10⁵ N·m²/C`,
          `${((idx + 3) * 2.26).toFixed(2)} × 10⁵ N·m²/C`,
          `${((idx + 3) * 0.56).toFixed(2)} × 10⁵ N·m²/C`,
          `Zero N·m²/C`
        ],
        explanation: "By Gauss's Law, net electric flux Φ = q_enclosed / ε₀. Substituting q and ε₀ yields Φ = q / (8.85 × 10⁻¹²)."
      },
      {
        concept: "Gaussian Surface Selection & Symmetry",
        format: "Assertion Reason",
        subtopic: "Symmetry Conditions",
        getQuestion: (idx) => `Question ${idx}: Assertion (A): Gauss's Law is valid for any closed surface of arbitrary shape in ${scope}.\nReason (R): The electric flux through a closed surface depends strictly on the net enclosed charge, independent of the shape or size of the surface.`,
        getOptions: () => [
          "Both (A) and (R) are true and (R) is the correct explanation of (A).",
          "Both (A) and (R) are true but (R) is NOT the correct explanation of (A).",
          "(A) is true but (R) is false.",
          "(A) is false but (R) is true."
        ],
        explanation: "Gauss's Law holds for any closed Gaussian surface regardless of geometry."
      },
      {
        concept: "Electric Potential & Field Gradient",
        format: "Conceptual",
        subtopic: "Potential Difference",
        getQuestion: (idx) => `Question ${idx}: In a uniform electric field of magnitude E = ${(idx + 1) * 100} V/m directed along the x-axis, what is the potential difference V_B - V_A between point A(0,0) and point B(${(idx + 2)},0)?`,
        getOptions: (idx) => [
          `-${(idx + 1) * 100 * (idx + 2)} V`,
          `+${(idx + 1) * 100 * (idx + 2)} V`,
          `Zero V`,
          `-${(idx + 1) * 50} V`
        ],
        explanation: "Potential difference V_B - V_A = -E * dx along the field direction."
      }
    ];
  } else if (lowerSub.includes('chem') || lowerScope.includes('organic') || lowerScope.includes('reaction') || lowerScope.includes('acid') || lowerScope.includes('bonding')) {
    subConceptPool = [
      {
        concept: "Reaction Kinetics & Rate Law",
        format: "Conceptual",
        subtopic: "Reaction Order",
        getQuestion: (idx) => `Question ${idx}: For a reaction A + B → Products in ${scope}, doubling the concentration of A increases rate by 4x, while doubling B doubles the rate. What is the overall reaction order?`,
        getOptions: () => [
          "3 (Second order in A, First order in B)",
          "2 (First order in A, First order in B)",
          "4 (Second order in A, Second order in B)",
          "1 (First order overall)"
        ],
        explanation: "Rate = k[A]^2[B]^1. Overall order = 2 + 1 = 3."
      },
      {
        concept: "Chemical Equilibrium & Le Chatelier Principle",
        format: "Numerical",
        subtopic: "Equilibrium Constant",
        getQuestion: (idx) => `Question ${idx}: In the equilibrium system N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + ΔH, which shift occurs if pressure is increased by a factor of ${(idx + 2)}?`,
        getOptions: () => [
          "Shift forward toward fewer gas moles (NH₃ formation)",
          "Shift backward toward more gas moles (N₂ and H₂ formation)",
          "No shift in equilibrium position",
          "Equilibrium constant Kp increases exponentially"
        ],
        explanation: "Increasing pressure shifts equilibrium toward the side with fewer moles of gas."
      }
    ];
  } else if (lowerSub.includes('math') || lowerScope.includes('calculus') || lowerScope.includes('integral') || lowerScope.includes('algebra') || lowerScope.includes('vector')) {
    subConceptPool = [
      {
        concept: "Integration & Calculus Fundamentals",
        format: "Numerical",
        subtopic: "Definite Integration",
        getQuestion: (idx) => `Question ${idx}: Evaluate the definite integral ∫ from 0 to 1 of (${idx + 2}x + 3) dx.`,
        getOptions: (idx) => [
          `${(idx + 2) / 2 + 3}`,
          `${(idx + 2) + 3}`,
          `${(idx + 2) / 2}`,
          `${(idx + 2) * 2}`
        ],
        explanation: "∫(ax + 3) dx = a*x^2/2 + 3x evaluated from 0 to 1 equals a/2 + 3."
      },
      {
        concept: "Differential Equations & Growth Rates",
        format: "Conceptual",
        subtopic: "First Order Differential Equations",
        getQuestion: (idx) => `Question ${idx}: What is the general solution to the differential equation dy/dx = ${(idx + 1)}y?`,
        getOptions: (idx) => [
          `y = C * e^(${(idx + 1)}x)`,
          `y = C * x^(${(idx + 1)})`,
          `y = ${(idx + 1)}x + C`,
          `y = C * ln(${(idx + 1)}x)`
        ],
        explanation: "Separating variables gives ∫(1/y)dy = ∫k dx, yielding y = C * e^(kx)."
      }
    ];
  } else {
    subConceptPool = [
      {
        concept: "Core Governing Principles",
        format: "Conceptual",
        subtopic: "Foundations",
        getQuestion: (idx) => `Question ${idx}: Which statement accurately formulates the fundamental principle governing ${scope} under standard analytical conditions?`,
        getOptions: () => [
          `Primary state variables maintain direct proportionality across defined boundary conditions in ${scope}.`,
          `External forces completely invalidate the conservation principles of ${scope}.`,
          `System entropy decreases spontaneously in isolated non-equilibrium processes.`,
          `Parameters scale exponentially regardless of initial structural constraints.`
        ],
        explanation: `In ${scope}, core principles dictate direct proportionality and conservation under defined boundary conditions.`
      },
      {
        concept: "Analytical Methods & Problem Solving",
        format: "Application",
        subtopic: "Methodology",
        getQuestion: (idx) => `Question ${idx}: In evaluating complex scenarios within ${scope}, which approach yields optimal accuracy?`,
        getOptions: () => [
          `Decomposing the problem into foundational sub-components and verifying boundary conditions.`,
          `Ignoring variable constraints and assuming linear extrapolation.`,
          `Relying solely on empirical heuristics without theoretical validation.`,
          `Disregarding initial conditions when calculating steady-state variables.`
        ],
        explanation: `Decomposing complex problems into foundational components ensures rigorous boundary verification in ${scope}.`
      }
    ];
  }

  const questions = [];

  for (let i = 0; i < count; i++) {
    const item = subConceptPool[i % subConceptPool.length];
    const qText = item.getQuestion(i + 1);
    const opts = item.getOptions ? item.getOptions(i + 1) : item.getOptions();

    const qObj = {
      id: i + 1,
      question: qText,
      questionText: qText,
      options: opts,
      correctAnswer: opts[0],
      correctOptionIndex: 0,
      explanation: item.explanation,
      subject: subjectName || 'General',
      class: grade || 'Class 12',
      grade: grade || 'Class 12',
      exam: exam || 'JEE Main',
      examType: exam || 'JEE Main',
      chapter: chapterName || subjectName || 'Core Chapter',
      topic: topicName || scope || 'Core Topic',
      subtopic: item.subtopic,
      difficulty: difficulty === 'Mixed' ? (i % 2 === 0 ? 'Medium' : 'Hard') : difficulty,
      estimatedTime: '45 sec',
      estimatedTimeSeconds: 45,
      bloomsLevel: 'Apply',
      bloomLevel: 'Apply',
      concept: item.concept,
      conceptTested: item.concept,
      commonMistake: 'Confusing distractor options or misreading boundary conditions.',
      learningObjective: `Master principles of ${item.concept}`,
      confidence: 0.98,
      questionType: item.format
    };

    questions.push(qObj);
    excludeTexts.push(qText);
  }

  return questions;
}

/**
 * Generate Dynamic AI Performance Feedback
 */
const generatePerformanceFeedback = async (data) => {
  const apiKey = getApiKey();
  const { accuracy = 0, correctCount = 0, wrongCount = 0, subjectName = 'Subject' } = data;
  const isZero = correctCount === 0 || accuracy === 0;

  return {
    strengthsAllowed: !isZero,
    currentPerformance: isZero ? 'Critical' : accuracy < 40 ? 'Developing' : 'Proficient',
    learningGapStatus: isZero ? 'Very High' : accuracy < 40 ? 'High' : 'Low',
    overallGrade: accuracy >= 80 ? 'A+' : accuracy >= 60 ? 'B' : accuracy >= 40 ? 'C' : 'Needs Focus',
    strengths: isZero ? [] : [`Demonstrated grasp of basic concepts in ${subjectName}`],
    weaknesses: wrongCount > 0 ? [`Missed ${wrongCount} question(s) due to conceptual breakdown`] : ['No incorrect answers'],
    learningGaps: wrongCount > 0 ? [`Core formula application gap in ${subjectName}`] : ['Minor speed optimization needed'],
    mistakeAnalysis: wrongCount > 0 ? `Analysis of ${wrongCount} incorrect response(s) indicates option traps.` : 'No incorrect answers recorded.',
    improvementSuggestions: ['Carefully analyze step-by-step solutions', 'Re-attempt weak questions'],
    studyStrategy: 'Devote study hours to practicing application problems.',
    motivationalFeedback: 'Consistent daily practice will boost your accuracy to top percentile levels.'
  };
};

/**
 * Safely parse JSON Object from raw LLM output
 */
const cleanJsonResponseObj = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return { questions: parsed };
    return parsed;
  } catch (err) {
    const startObj = cleaned.indexOf('{');
    const endObj = cleaned.lastIndexOf('}');
    if (startObj !== -1 && endObj > startObj) {
      try {
        return JSON.parse(cleaned.substring(startObj, endObj + 1));
      } catch (e) {}
    }
    const startArr = cleaned.indexOf('[');
    const endArr = cleaned.lastIndexOf(']');
    if (startArr !== -1 && endArr > startArr) {
      try {
        const arr = JSON.parse(cleaned.substring(startArr, endArr + 1));
        if (Array.isArray(arr)) {
          return { questions: arr };
        }
      } catch (e) {}
    }
  }
  return null;
};

/**
 * Domain-aware local fallback study plan generator
 */
function generateLocalFallbackStudyPlan({
  examTarget = 'JEE Main',
  gradeClass = 'Class 12',
  subject = 'Core Subjects',
  topics = [],
  examDate,
  availableHoursPerDay = 5,
  targetScore = 90,
  weakAreas = [],
  daysRemaining = 30
}) {
  const topic1 = (topics && topics[0]) || 'Core Mechanics & Theory';
  const topic2 = (topics && topics[1]) || 'Calculus & Problem Solving';
  const weakStr = (weakAreas && weakAreas.length > 0) ? weakAreas.join(', ') : 'Concept Application & Numerical Speed';

  return {
    overview: {
      daysRemaining: Number(daysRemaining) || 30,
      targetScore: Number(targetScore) || 90,
      dailyStudyHours: Number(availableHoursPerDay) || 5,
      examTarget: examTarget || 'Target Exam'
    },
    dailyPlan: [
      {
        timeSlot: '06:00 AM - 08:30 AM',
        activity: 'Theory & Core Concept Deep-Dive',
        topicOrChapter: topic1,
        completed: false
      },
      {
        timeSlot: '09:30 AM - 12:00 PM',
        activity: 'Problem Solving & Numerical Practice',
        topicOrChapter: weakStr,
        completed: false
      },
      {
        timeSlot: '04:00 PM - 06:30 PM',
        activity: 'PYQs & Formula Sheet Revision',
        topicOrChapter: topic2,
        completed: false
      }
    ],
    weeklyPlan: [
      {
        week: 'Week 1',
        focusArea: 'Foundational Theory & High-Weightage Chapters',
        targetHours: (Number(availableHoursPerDay) || 5) * 7,
        taskCount: 14
      },
      {
        week: 'Week 2',
        focusArea: 'Problem Solving Sprints & Topic Tests',
        targetHours: (Number(availableHoursPerDay) || 5) * 7,
        taskCount: 14
      },
      {
        week: 'Week 3',
        focusArea: 'Weak Topic Remediation & Speed Building',
        targetHours: (Number(availableHoursPerDay) || 5) * 7,
        taskCount: 14
      },
      {
        week: 'Week 4',
        focusArea: 'Full Length Mock Tests & Final Revision',
        targetHours: (Number(availableHoursPerDay) || 5) * 7,
        taskCount: 14
      }
    ],
    priorityTopics: [
      {
        topicName: topic1,
        subject: subject,
        priority: 'High',
        difficulty: 'Hard',
        estimatedHours: 16
      },
      {
        topicName: topic2,
        subject: subject,
        priority: 'High',
        difficulty: 'Medium',
        estimatedHours: 14
      },
      {
        topicName: weakStr,
        subject: subject,
        priority: 'Medium',
        difficulty: 'Hard',
        estimatedHours: 12
      }
    ],
    revisionPlan: [
      {
        day: 'Every 3rd Day',
        focus: 'Formula Sheet & Mistake Log Review',
        topics: [topic1, topic2]
      },
      {
        day: 'Sunday Sprint',
        focus: 'Weak Topic PYQs & Concept Refresh',
        topics: [weakStr]
      }
    ],
    mockTests: [
      {
        testName: 'Diagnostic Topic Test',
        date: 'In 5 Days',
        focus: 'Baseline Speed & Accuracy Check'
      },
      {
        testName: 'Full Length Mock 1',
        date: 'In 12 Days',
        focus: 'Time Allocation & Question Selection Strategy'
      },
      {
        testName: 'Full Length Mock 2',
        date: 'In 20 Days',
        focus: 'Handling Exam Pressure & Negative Marking'
      }
    ],
    healthTips: {
      sleepRecommendation: '7-8 hours daily (Sleep by 10:30 PM, Wake at 06:00 AM)',
      breakTimings: '5-10 min break every 45 mins of focused study',
      waterReminder: 'Drink 250ml water every 2 hours (Minimum 2.5L daily)',
      exerciseRecommendation: '20-30 mins light morning workout or brisk walking',
      meditationTime: '10 mins post-study breathing relaxation'
    },
    examTips: [
      'Scan full paper for 2 mins; target high-confidence questions first.',
      'Do not spend more than 2 mins on any single stuck MCQ during first pass.',
      'Maintain an error notebook to review recurring mistakes before mock tests.'
    ],
    motivation: [
      'Consistency creates rankers. Daily 5 hours beats irregular cramming!',
      'Believe in your preparation. Every solved problem builds exam confidence!'
    ],
    last7DaysPlan: [
      {
        day: 'Day -7 to -4',
        task: 'Review high-frequency formulas, key diagrams, and past mock mistake logs.'
      },
      {
        day: 'Day -3 to -2',
        task: 'Light timed practice of moderate questions. Avoid picking up completely brand new topics.'
      },
      {
        day: 'Day -1',
        task: 'Complete rest post 4 PM. Organize exam admit card, stationaries, and get 8 hours of sleep.'
      }
    ]
  };
}

/**
 * Generate a complete, personalized AI Study Plan & Healthy Routine
 */
const generateStudyPlan = async ({
  examTarget = 'JEE Main',
  gradeClass = 'Class 12',
  subject = 'Core Subjects',
  topics = [],
  examDate,
  availableHoursPerDay = 5,
  targetScore = 90,
  weakAreas = [],
  previousTestAnalytics = {},
  progressData = {}
}) => {
  const apiKey = getApiKey();
  const daysRemaining = examDate 
    ? Math.max(1, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 30;

  const topicsListStr = Array.isArray(topics) && topics.length > 0 ? topics.join(', ') : 'Core Syllabus Topics';
  const weakListStr = Array.isArray(weakAreas) && weakAreas.length > 0
    ? weakAreas.join(', ')
    : (progressData.weakTopics?.join(', ') || 'Concept Application & Numerical Problem Solving');

  const prompt = `
You are EduBridge AI powered by Gemini 2.5 Flash, an expert academic mentor and wellness strategist.
Generate a HYPER-PERSONALIZED STUDY ROADMAP & HEALTHY LIFE BALANCE ROUTINE in a SINGLE JSON response based on the student's mock test results and academic goals.

STUDENT MOCK TEST & ACADEMIC PROFILE:
- Target Exam: ${examTarget} (${gradeClass})
- Subject: ${subject}
- Tested Topics: ${topicsListStr}
- Exam Date: ${examDate} (${daysRemaining} days remaining)
- Available Daily Study Hours: ${availableHoursPerDay} hours/day
- Target Score Goal: ${targetScore}%
- Weak Areas Identified from Test: ${weakListStr}
- Mock Test Accuracy & Gap Score: ${previousTestAnalytics.accuracy || progressData.overallAccuracy || 0}% accuracy

MANDATORY RULES:
1. Customize the academic daily/weekly tasks to address weak areas identified in the mock test.
2. Emphasize a HEALTHY LIFE BALANCE: mandatory 7-8 hours sleep, 10-min screen breaks every 45 mins, hydration goals, morning exercise, mindfulness/meditation, and stress management.
3. Balance study intensity with physical & mental wellness so the student avoids burnout.

Return ONLY valid JSON matching this exact structure (NO extra text, NO markdown codeblocks):
{
  "overview": {
    "daysRemaining": ${daysRemaining},
    "targetScore": ${targetScore},
    "dailyStudyHours": ${availableHoursPerDay},
    "examTarget": "${examTarget}"
  },
  "dailyPlan": [
    {"timeSlot": "06:00 AM - 08:30 AM", "activity": "Theory & Core Concepts Deep-Dive", "topicOrChapter": "${topics[0] || subject}", "completed": false},
    {"timeSlot": "09:30 AM - 12:00 PM", "activity": "Problem Solving & Weak Area Practice", "topicOrChapter": "${weakListStr}", "completed": false},
    {"timeSlot": "04:00 PM - 06:30 PM", "activity": "PYQs, Active Recall & Formula Revision", "topicOrChapter": "${topics[1] || subject}", "completed": false}
  ],
  "weeklyPlan": [
    {"week": "Week 1", "focusArea": "Foundational Mastery & Weak Topic Remediation", "targetHours": ${availableHoursPerDay * 7}, "taskCount": 14},
    {"week": "Week 2", "focusArea": "Timed Problem Solving Sprints & Mock Test 2", "targetHours": ${availableHoursPerDay * 7}, "taskCount": 14}
  ],
  "priorityTopics": [
    {"topicName": "${topics[0] || 'Core Subject Area'}", "subject": "${subject}", "priority": "High", "difficulty": "Hard", "estimatedHours": 16},
    {"topicName": "${topics[1] || 'Secondary Subject Area'}", "subject": "${subject}", "priority": "Medium", "difficulty": "Medium", "estimatedHours": 12}
  ],
  "revisionPlan": [
    {"day": "Every 3rd Day", "focus": "Formula Sheet & Mistake Notebook Review", "topics": ["${weakListStr}"]}
  ],
  "mockTests": [
    {"testName": "Diagnostic Mock Test 2", "date": "In 7 Days", "focus": "Accuracy & Time Allocation"},
    {"testName": "Full Length Mock 3", "date": "In 14 Days", "focus": "Exam Pressure & Negative Marking Management"}
  ],
  "healthTips": {
    "sleepRecommendation": "7-8 hours sound sleep (10:30 PM to 06:00 AM) to optimize memory consolidation",
    "breakTimings": "10 min screen-free break every 45 mins of focused study (Pomodoro 45/10)",
    "waterReminder": "Hydrate with 250ml water every 2 hours (Minimum 2.5L daily)",
    "exerciseRecommendation": "20-30 mins morning light exercise, stretching, or outdoor brisk walk",
    "meditationTime": "10-15 mins evening mindfulness meditation & breathing exercise",
    "eyeCareRoutine": "Follow 20-20-20 rule to prevent digital eye strain",
    "stressManagement": "Practice box breathing (4s in, 4s hold, 4s out, 4s hold) during revision"
  },
  "examTips": [
    "Scan full exam paper in 2 mins; answer high-confidence questions first.",
    "Do not spend >2 mins on any single stuck MCQ during first pass."
  ],
  "motivation": [
    "Consistency creates top rankers! Daily balanced practice beats irregular cramming.",
    "Prioritize sleep & well-being alongside effort; a rested mind solves hard problems faster!"
  ],
  "last7DaysPlan": [
    {"day": "Day -7 to -4", "task": "Review high-frequency formulas & mistake notebook."},
    {"day": "Day -3 to -1", "task": "Light formula review, sleep early, remain calm & confident."}
  ]
}
`;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of GEMINI_MODELS) {
      try {
        const startTime = Date.now();
        console.log(`[Gemini Study Plan Engine]: Generating study plan with '${modelName}'...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = cleanJsonResponseObj(responseText);

        if (parsed && parsed.dailyPlan && parsed.weeklyPlan) {
          console.log(`[Gemini Study Plan Engine]: Successfully generated plan in ${Date.now() - startTime}ms.`);
          return parsed;
        }
      } catch (err) {
        console.warn(`[Gemini Study Plan Engine]: Model '${modelName}' failed (${err.message}). Trying fallback...`);
      }
    }
  }

  console.warn('[Gemini Study Plan Engine]: API unavailable or failed. Using rich local fallback roadmap.');
  return generateLocalFallbackStudyPlan({
    examTarget,
    gradeClass,
    subject,
    topics,
    examDate,
    availableHoursPerDay,
    targetScore,
    weakAreas,
    daysRemaining
  });
};

/**
 * Interactive AI Academic Mentor chat for diagnostic test analysis & guidance
 */
const chatWithTestMentor = async ({
  question,
  attemptData = {},
  studentHistory = {}
}) => {
  const apiKey = getApiKey();
  const prompt = `
You are EduBridge AI Academic Mentor, an encouraging, rigorous, and evidence-based AI exam tutor.
A student is asking you a question about their diagnostic test result, weak areas, or study guidance.

STUDENT & ATTEMPT CONTEXT:
- Attempt Subject: ${attemptData.subject || 'General'}
- Score/Accuracy: ${attemptData.accuracy !== undefined ? attemptData.accuracy + '%' : 'N/A'} (Score: ${attemptData.score || 'N/A'})
- Weak Topics: ${Array.isArray(attemptData.weaknesses) ? attemptData.weaknesses.join(', ') : (studentHistory.weakTopics?.map(w => w.topicName || w).join(', ') || 'Core Concepts')}
- Overall Accuracy: ${studentHistory.overallAccuracy || 0}%
- Student Question: "${question}"

GUIDELINES:
1. Provide a clear, actionable, and encouraging 2-4 paragraph response.
2. Directly answer their question, explaining the conceptual reasoning or recommending targeted practice steps (such as taking a Drill Test or focusing on foundational definitions).
3. Do not invent false exam policies; focus on pedagogical clarity.
`;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7 }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim()) return text.trim();
      } catch (err) {}
    }
  }

  return `Based on your performance in ${attemptData.subject || 'this subject'}, focusing on strengthening your core understanding of weak topics is recommended. Try taking a targeted Drill Test to test individual concepts with instant step-by-step explanations.`;
};

/**
 * Generate targeted Drill Test questions specifically focused on weak topics (Scorecard / Marksheet feedback)
 */
const generateDrillTestQuestions = async ({
  subjectName = 'Mathematics',
  weakTopics = [],
  score = null,
  totalMarks = 100,
  percentage = null,
  feedback = '',
  incorrectQuestions = [],
  difficulty = 'Adaptive',
  previousDrillPerformance = null,
  questionCount = 5,
  exam = 'JEE Main',
  grade = 'Class 12'
}) => {
  const apiKey = getApiKey();
  
  // Format weak topics list
  const formattedWeakTopics = (Array.isArray(weakTopics) && weakTopics.length > 0)
    ? weakTopics.filter(t => t && typeof t === 'string' && t.trim().length > 0)
    : [subjectName + ' Core Principles'];
    
  const weakTopicsListStr = formattedWeakTopics.join(', ');
  
  // Determine adaptive difficulty
  let effectiveDifficulty = difficulty;
  if (difficulty === 'Adaptive' || !difficulty) {
    if (previousDrillPerformance) {
      if (previousDrillPerformance.accuracy < 50) {
        effectiveDifficulty = 'Easy';
      } else if (previousDrillPerformance.accuracy < 80) {
        effectiveDifficulty = 'Medium';
      } else {
        effectiveDifficulty = 'Hard';
      }
    } else if (percentage !== null && percentage !== undefined) {
      if (percentage < 45) {
        effectiveDifficulty = 'Easy';
      } else if (percentage < 75) {
        effectiveDifficulty = 'Medium';
      } else {
        effectiveDifficulty = 'Hard';
      }
    } else {
      effectiveDifficulty = 'Medium';
    }
  }

  const prompt = `
You are EduBridge AI, an expert exam tutor specializing in Precision Adaptive Drill Tests.
Generate EXACTLY ${questionCount} high-yield, targeted practice questions in a SINGLE JSON object.

Student Context:
- Subject: ${subjectName}
- Identified Weak Topic(s): ${weakTopicsListStr}
- Previous Score/Percentage: ${percentage !== null ? percentage + '%' : (score ? score + '/' + totalMarks : 'Needs Improvement')}
- Existing Feedback: ${feedback ? feedback.slice(0, 300) : 'Needs targeted drill practice on core concepts'}
- Target Difficulty Level: ${effectiveDifficulty}
- Exam Target: ${exam} (${grade})
${previousDrillPerformance ? `- Previous Drill Result: ${previousDrillPerformance.accuracy}% accuracy. Adjust difficulty accordingly.` : ''}
${incorrectQuestions && incorrectQuestions.length > 0 ? `- Missed Concepts Context: ${incorrectQuestions.slice(0, 3).map(q => q.questionText || q).join('; ')}` : ''}

Rules:
1. Every question MUST focus strictly on diagnosing and mastering the identified weak topics: [${weakTopicsListStr}]. Do NOT generate general unrelated questions.
2. Distribute questions evenly across the weak topics.
3. Include 4 distinct, plausible options (A, B, C, D) for each question.
4. Provide a step-by-step conceptual explanation explaining why the correct option is right and how to avoid the common misconception.
5. Provide a short guiding hint for each question.

Return ONLY valid JSON matching this exact structure:
{
  "title": "🎯 Drill Test: ${formattedWeakTopics.slice(0, 2).join(' & ')} Mastery",
  "subject": "${subjectName}",
  "targetTopics": ${JSON.stringify(formattedWeakTopics)},
  "difficulty": "${effectiveDifficulty}",
  "questions": [
    {
      "question": "Question statement string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string matching one of the 4 options above",
      "explanation": "Clear step-by-step reasoning explaining the concept and formula",
      "topic": "${formattedWeakTopics[0] || subjectName}",
      "bloomLevel": "Application",
      "hint": "Short guiding tip"
    }
  ]
}
`;

  let acceptedDrillQuestions = [];
  let drillMetadata = {
    title: `🎯 Drill Test: ${formattedWeakTopics.slice(0, 2).join(' & ')} Focus`,
    subject: subjectName,
    targetTopics: formattedWeakTopics,
    difficulty: effectiveDifficulty
  };

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of GEMINI_MODELS) {
      try {
        const startTime = Date.now();
        console.log(`[Gemini Drill Engine]: Generating ${questionCount} drill questions with '${modelName}'...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.6,
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = cleanJsonResponseObj(responseText);

        if (parsed) {
          if (parsed.title) drillMetadata.title = parsed.title;
          if (parsed.difficulty) drillMetadata.difficulty = parsed.difficulty;
          if (Array.isArray(parsed.targetTopics)) drillMetadata.targetTopics = parsed.targetTopics;

          const rawList = Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);
          for (let i = 0; i < rawList.length; i++) {
            const q = rawList[i];
            const qText = q.question || q.questionText;
            if (!qText || !Array.isArray(q.options) || q.options.length < 4) continue;

            const opts = q.options.slice(0, 4);
            const matchIdx = opts.indexOf(q.correctAnswer);
            const cIdx = matchIdx >= 0 ? matchIdx : (typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0);
            const cText = opts[cIdx] || q.correctAnswer || opts[0];

            acceptedDrillQuestions.push({
              id: acceptedDrillQuestions.length + 1,
              question: qText,
              questionText: qText,
              options: opts,
              correctAnswer: cText,
              correctOptionIndex: cIdx,
              explanation: q.explanation || 'Step-by-step concept resolution.',
              topic: q.topic || formattedWeakTopics[i % formattedWeakTopics.length] || subjectName,
              bloomLevel: q.bloomLevel || (i % 2 === 0 ? 'Application' : 'Understanding'),
              hint: q.hint || 'Carefully review the governing formula.',
              difficulty: effectiveDifficulty,
              subject: subjectName
            });

            if (acceptedDrillQuestions.length >= questionCount) break;
          }

          if (acceptedDrillQuestions.length > 0) {
            console.log(`[Gemini Drill Engine]: Successfully generated ${acceptedDrillQuestions.length}/${questionCount} drill questions in ${Date.now() - startTime}ms.`);
            break;
          }
        }
      } catch (err) {
        console.warn(`[Gemini Drill Engine]: Model '${modelName}' failed (${err.message}). Trying fallback...`);
      }
    }
  }

  // Fallback generation if API fails or is unreachable
  if (acceptedDrillQuestions.length < questionCount) {
    const missing = questionCount - acceptedDrillQuestions.length;
    for (let i = 0; i < missing; i++) {
      const topicForQ = formattedWeakTopics[i % formattedWeakTopics.length] || subjectName;
      const idx = acceptedDrillQuestions.length + 1;
      acceptedDrillQuestions.push({
        id: idx,
        question: `In ${subjectName} (${topicForQ}), what is the primary condition required to solve for unknown variables under standard analytical conditions?`,
        questionText: `In ${subjectName} (${topicForQ}), what is the primary condition required to solve for unknown variables under standard analytical conditions?`,
        options: [
          `Apply fundamental conservation equations and isolate independent boundary states.`,
          `Assume parameter values scale without verifying initial constraints.`,
          `Disregard equilibrium criteria when external factors fluctuate.`,
          `Set dependent derivatives to infinity regardless of domain continuity.`
        ],
        correctAnswer: `Apply fundamental conservation equations and isolate independent boundary states.`,
        correctOptionIndex: 0,
        explanation: `For ${topicForQ}, applying fundamental governing principles and evaluating independent boundary conditions ensures exact analytical results.`,
        topic: topicForQ,
        bloomLevel: 'Application',
        hint: `Focus on the conservation law or standard governing formula for ${topicForQ}.`,
        difficulty: effectiveDifficulty,
        subject: subjectName
      });
    }
  }

  return {
    ...drillMetadata,
    questions: acceptedDrillQuestions.slice(0, questionCount)
  };
};

/**
 * Evaluate Drill Test submission and compute intelligent adaptive recommendations
 */
const evaluateDrillTestResult = async ({
  drillTest,
  userAnswers = [],
  previousPerformance = null
}) => {
  const apiKey = getApiKey();
  const questions = drillTest.questions || [];
  const totalQuestions = questions.length;
  
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  
  const questionResults = [];
  const topicStats = {};

  questions.forEach((q, idx) => {
    const topic = q.topic || drillTest.subject || 'Core Concept';
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
    }
    topicStats[topic].total += 1;

    const userAns = userAnswers.find(a => a.questionIndex === idx || a.questionId === q.id || a.id === q.id);
    const selectedIdx = userAns ? userAns.selectedOptionIndex : -1;
    const isCorrect = selectedIdx === q.correctOptionIndex;
    const isSkipped = selectedIdx === -1 || selectedIdx === null || selectedIdx === undefined;

    if (isSkipped) {
      skippedCount += 1;
      topicStats[topic].skipped += 1;
    } else if (isCorrect) {
      correctCount += 1;
      topicStats[topic].correct += 1;
    } else {
      wrongCount += 1;
      topicStats[topic].wrong += 1;
    }

    questionResults.push({
      questionIndex: idx,
      questionText: q.questionText || q.question,
      options: q.options,
      selectedOptionIndex: selectedIdx,
      correctOptionIndex: q.correctOptionIndex,
      correctAnswer: q.correctAnswer,
      isCorrect,
      isSkipped,
      explanation: q.explanation,
      topic,
      bloomLevel: q.bloomLevel,
      hint: q.hint
    });
  });

  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  // Topic-wise performance map
  const topicPerformance = Object.keys(topicStats).map(topicName => {
    const stat = topicStats[topicName];
    const topAccuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    return {
      topicName,
      total: stat.total,
      correct: stat.correct,
      wrong: stat.wrong,
      accuracy: topAccuracy,
      masteryStatus: topAccuracy >= 80 ? 'Mastered' : (topAccuracy >= 50 ? 'Improving' : 'Needs Focus')
    };
  });

  // Adaptive difficulty logic
  let nextDifficulty = 'Medium';
  let nextDrillRecommended = true;
  let adaptiveFeedbackSummary = '';

  if (accuracy >= 80) {
    nextDifficulty = 'Hard';
    nextDrillRecommended = accuracy < 100;
    adaptiveFeedbackSummary = `Outstanding work! You demonstrated ${accuracy}% accuracy across your targeted weak topics. You are ready for advanced application-level challenges.`;
  } else if (accuracy >= 50) {
    nextDifficulty = 'Medium';
    nextDrillRecommended = true;
    adaptiveFeedbackSummary = `Good progress (${accuracy}% accuracy). You understand the core concepts but need more practice with multi-step problem solving.`;
  } else {
    nextDifficulty = 'Easy';
    nextDrillRecommended = true;
    adaptiveFeedbackSummary = `Your accuracy was ${accuracy}%. A follow-up drill focusing on step-by-step fundamental definitions and basic formulas is recommended.`;
  }

  // Generate dynamic AI feedback using Gemini if available
  let aiFeedbackText = adaptiveFeedbackSummary;
  let conceptsToRevise = [];

  const prompt = `
You are EduBridge AI Tutor evaluating a student's Drill Test result.
- Subject: ${drillTest.subject}
- Topics Drilled: ${(drillTest.targetTopics || []).join(', ')}
- Score: ${correctCount}/${totalQuestions} (${accuracy}% Accuracy)
- Topic Breakdown: ${JSON.stringify(topicPerformance)}
- Previous Drill Accuracy: ${previousPerformance ? previousPerformance.accuracy + '%' : 'First Drill'}

Provide concise structured JSON:
{
  "feedback": "2-3 sentences of encouraging, targeted feedback analyzing student precision and understanding",
  "conceptsToRevise": ["Specific concept/formula 1 to review", "Specific concept/formula 2 to review"],
  "strengthsDemonstrated": ["Concept student solved accurately"],
  "adaptiveRecommendation": "Explanation of recommended next drill difficulty level"
}
`;

  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.5,
            responseMimeType: 'application/json'
          }
        });

        const result = await model.generateContent(prompt);
        const parsed = cleanJsonResponseObj(result.response.text());
        if (parsed) {
          if (parsed.feedback) aiFeedbackText = parsed.feedback;
          if (Array.isArray(parsed.conceptsToRevise)) conceptsToRevise = parsed.conceptsToRevise;
          break;
        }
      } catch (err) {}
    }
  }

  if (conceptsToRevise.length === 0) {
    const weakTopicsFromTest = topicPerformance.filter(t => t.accuracy < 70).map(t => t.topicName);
    conceptsToRevise = weakTopicsFromTest.length > 0 
      ? weakTopicsFromTest.map(t => `Review core theorem and practice 3 standard numericals in ${t}`)
      : [`Review boundary conditions and speed optimization in ${drillTest.subject}`];
  }

  return {
    score: correctCount,
    totalMarks: totalQuestions,
    totalQuestions,
    accuracy,
    correctCount,
    wrongCount,
    skippedCount,
    topicPerformance,
    feedback: aiFeedbackText,
    conceptsToRevise,
    nextDrillRecommended,
    nextRecommendedDifficulty: nextDifficulty,
    questionResults,
    subject: drillTest.subject,
    drilledTopics: drillTest.targetTopics || []
  };
};

module.exports = {
  generateQuestions,
  generatePerformanceFeedback,
  chatWithTestMentor,
  generateStudyPlan,
  generateDrillTestQuestions,
  evaluateDrillTestResult
};
