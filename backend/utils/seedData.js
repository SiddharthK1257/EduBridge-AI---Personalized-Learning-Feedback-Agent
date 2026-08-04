const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const seedDataCatalog = [
  // 1. Physics (JEE Main / NEET / Class 11 / Class 12)
  {
    name: 'Physics',
    category: 'School',
    applicableExams: ['JEE Main', 'JEE Advanced', 'NEET', 'CBSE', 'ICSE', 'Physics'],
    applicableGrades: ['Class 11', 'Class 12'],
    description: 'Study of matter, motion, energy, mechanics, thermodynamics, optics, and modern physics.',
    icon: 'Zap',
    chapters: [
      'Units and Dimensions',
      'Kinematics',
      'Laws of Motion',
      'Work Energy and Power',
      'Gravitation',
      'Thermodynamics',
      'Oscillations',
      'Waves',
      'Current Electricity',
      'Magnetism',
      'Electromagnetic Induction',
      'Optics',
      'Modern Physics'
    ],
    topics: [
      'Vectors & Dimensional Analysis',
      'Motion in 1D & 2D',
      'Newton Laws & Friction',
      'Work, Energy & Power Theorem',
      'Universal Law of Gravitation',
      'First & Second Law of Thermodynamics',
      'Simple Harmonic Motion (SHM)',
      'Wave Interference & Beats',
      'Ohm Law & Kirchhoff Circuit Laws',
      'Magnetic Field & Ampere Law',
      'Faraday Law & Lenz Law',
      'Ray Optics & Refraction',
      'Photoelectric Effect & Atomic Structure'
    ]
  },
  // 2. Chemistry (JEE Main / NEET / Class 11 / Class 12)
  {
    name: 'Chemistry',
    category: 'School',
    applicableExams: ['JEE Main', 'JEE Advanced', 'NEET', 'CBSE', 'ICSE', 'Chemistry'],
    applicableGrades: ['Class 11', 'Class 12'],
    description: 'Physical, organic, and inorganic chemistry principles.',
    icon: 'FlaskConical',
    chapters: [
      'Atomic Structure',
      'Chemical Bonding',
      'States of Matter',
      'Thermodynamics',
      'Equilibrium',
      'Electrochemistry',
      'Organic Chemistry',
      'Biomolecules'
    ],
    topics: [
      'Bohr Model & Quantum Numbers',
      'VSEPR Theory & Hybridization',
      'Ideal Gas Equation & Kinetic Theory',
      'Enthalpy, Entropy & Gibbs Free Energy',
      'Chemical & Ionic Equilibrium',
      'Nernst Equation & Galvanic Cells',
      'Reaction Mechanisms & IUPAC Naming',
      'Carbohydrates, Proteins & Nucleic Acids'
    ]
  },
  // 3. Mathematics (JEE Main / Class 11 / Class 12)
  {
    name: 'Mathematics',
    category: 'School',
    applicableExams: ['JEE Main', 'JEE Advanced', 'CBSE', 'ICSE', 'CUET', 'Mathematics'],
    applicableGrades: ['Class 11', 'Class 12'],
    description: 'Algebra, calculus, vectors, 3D geometry, statistics, and probability.',
    icon: 'Calculator',
    chapters: [
      'Relations and Functions',
      'Limits',
      'Continuity',
      'Differentiation',
      'Integration',
      'Vectors',
      '3D Geometry',
      'Probability',
      'Statistics',
      'Matrices',
      'Determinants'
    ],
    topics: [
      'Domain, Range & Composite Functions',
      'Standard Limits & L-Hopital Rule',
      'Continuity & Differentiability',
      'Chain Rule & Application of Derivatives',
      'Definite & Indefinite Integrals',
      'Vector Dot & Cross Product',
      'Lines & Planes in 3D Space',
      'Conditional Probability & Bayes Theorem',
      'Mean, Variance & Standard Deviation',
      'Matrix Algebra & Inverse Matrix',
      'Properties & Applications of Determinants'
    ]
  },
  // 4. Biology (NEET / Class 11 / Class 12)
  {
    name: 'Biology',
    category: 'School',
    applicableExams: ['NEET', 'CBSE', 'ICSE', 'CUET', 'Biology'],
    applicableGrades: ['Class 11', 'Class 12'],
    description: 'Botany, zoology, genetics, human physiology, biotechnology, and ecology.',
    icon: 'Dna',
    chapters: [
      'Cell',
      'Genetics',
      'Evolution',
      'Plant Physiology',
      'Human Physiology',
      'Ecology',
      'Biotechnology'
    ],
    topics: [
      'Cell Structure & Organelles',
      'Mendelian Inheritance & DNA Replication',
      'Darwinism & Human Evolution',
      'Photosynthesis & Plant Respiration',
      'Circulatory, Digestive & Nervous Systems',
      'Ecosystems & Biodiversity Conservation',
      'Recombinant DNA Technology & PCR'
    ]
  },
  // 5. Java (Programming)
  {
    name: 'Java',
    category: 'Programming',
    applicableExams: ['Java', 'Java Interview', 'GATE', 'Software Engineering'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Core Java programming, OOP concepts, Collections framework, streams, and multithreading.',
    icon: 'Code2',
    chapters: [
      'Variables',
      'Data Types',
      'Operators',
      'Loops',
      'Methods',
      'Arrays',
      'Strings',
      'OOP',
      'Inheritance',
      'Polymorphism',
      'Abstraction',
      'Interfaces',
      'Exception Handling',
      'Collections',
      'Generics',
      'Multithreading',
      'Streams',
      'File Handling'
    ],
    topics: [
      'Primitive vs Reference Variables',
      'Type Casting & Data Conversions',
      'Arithmetic & Bitwise Operators',
      'For, While & Do-While Loops',
      'Method Signatures & Overloading',
      '1D and 2D Array Operations',
      'String Mutability & StringBuilder',
      'Classes & Objects Architecture',
      'Super & Extends Keywords',
      'Method Overriding & Dynamic Binding',
      'Abstract Classes vs Interfaces',
      'Interface Default & Static Methods',
      'Try-Catch-Finally & Custom Exceptions',
      'ArrayList, HashMap, and HashSet',
      'Generic Types & Wildcards',
      'Thread Lifecycle & Synchronization',
      'Java 8 Stream API & Lambda Expressions',
      'File I/O & BufferedReader/BufferedWriter'
    ]
  },
  // 6. Python (Programming)
  {
    name: 'Python',
    category: 'Programming',
    applicableExams: ['Python', 'Python Interview', 'Data Science', 'AI & ML'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'B.Sc', 'MCA', 'Not Applicable'],
    description: 'Python syntax, data structures, OOP, file handling, decorators, and libraries.',
    icon: 'Terminal',
    chapters: [
      'Variables and Data Types',
      'Control Flow & Loops',
      'Functions and Modules',
      'Lists, Tuples & Dictionaries',
      'OOP in Python',
      'File Handling',
      'Exception Handling',
      'Decorators & Generators',
      'Standard Library & Modules'
    ],
    topics: [
      'Dynamic Typing & Mutability',
      'If-Else & Break/Continue',
      'Def, Args, Kwargs & Lambdas',
      'List Comprehensions & Dict Methods',
      'Self Keyword & Inheritance',
      'With Statement & File I/O',
      'Try-Except Blocks & Custom Errors',
      'Yield Keyword & Function Decorators',
      'Math, Os & Sys Modules'
    ]
  },
  // 7. JavaScript (Programming)
  {
    name: 'JavaScript',
    category: 'Programming',
    applicableExams: ['JavaScript', 'React Interview', 'Node.js Interview', 'Web Development'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Modern JavaScript (ES6+), async programming, closures, DOM, and event loop.',
    icon: 'Code',
    chapters: [
      'Variables & Scope',
      'Data Types & Operators',
      'Functions & Arrow Functions',
      'Objects & Prototypes',
      'Arrays & Array Methods',
      'Asynchronous JS & Promises',
      'DOM Manipulation',
      'ES6+ Features',
      'Event Loop & Closures'
    ],
    topics: [
      'Var, Let, Const & Hoisting',
      'Equality (== vs ===) & Coercion',
      'Function Declarations vs Arrow Functions',
      'Prototype Chain & Object Methods',
      'Map, Filter, Reduce & Foreach',
      'Promise Chaining & Async/Await',
      'QuerySelector & Event Listeners',
      'Destructuring, Spread & Rest Operators',
      'Call Stack, Microtask Queue & Scope Chains'
    ]
  },
  // 8. DBMS
  {
    name: 'DBMS',
    category: 'Programming',
    applicableExams: ['DBMS', 'SQL Interview', 'GATE', 'Software Engineering'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Relational databases, SQL queries, normalization, ACID properties, and indexing.',
    icon: 'Database',
    chapters: [
      'Introduction to DBMS',
      'ER Diagrams',
      'Relational Model & SQL',
      'Normalization',
      'Transactions & ACID',
      'Concurrency Control',
      'Indexing & Hashing'
    ],
    topics: [
      'Database Architectures (1-Tier, 2-Tier, 3-Tier)',
      'Entities, Attributes & Keys',
      'DDL, DML, Joins & Subqueries',
      '1NF, 2NF, 3NF & BCNF Rules',
      'Atomicity, Consistency, Isolation, Durability',
      'Locking Protocols & Deadlock Prevention',
      'B-Trees & B+ Tree Indexing'
    ]
  },
  // 9. Operating Systems
  {
    name: 'Operating Systems',
    category: 'Programming',
    applicableExams: ['Operating Systems', 'GATE', 'Software Engineering'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Process management, CPU scheduling, synchronization, memory management, and file systems.',
    icon: 'Cpu',
    chapters: [
      'Processes & Threads',
      'CPU Scheduling Algorithms',
      'Process Synchronization',
      'Deadlocks',
      'Memory Management & Paging',
      'Virtual Memory',
      'File Systems'
    ],
    topics: [
      'Process Control Block (PCB) & Context Switching',
      'FCFS, SJF, Round Robin & Priority Scheduling',
      'Semaphores, Mutex & Critical Section Problem',
      'Banker Algorithm & Deadlock Detection',
      'Paging, Segmentation & Memory Allocation',
      'Page Replacement (FIFO, LRU, Optimal)',
      'File Allocation Methods & Inodes'
    ]
  },
  // 10. Computer Networks
  {
    name: 'Computer Networks',
    category: 'Programming',
    applicableExams: ['Computer Networks', 'GATE', 'Software Engineering'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Networking models (OSI/TCP-IP), IP addressing, routing protocols, and transport layer.',
    icon: 'Network',
    chapters: [
      'Network Architecture & OSI Model',
      'Physical & Data Link Layer',
      'IP Addressing & Subnetting',
      'Routing Algorithms',
      'Transport Protocols (TCP/UDP)',
      'Application Layer Protocols'
    ],
    topics: [
      'OSI 7 Layers vs TCP/IP Suite',
      'Framing, Error Detection & Sliding Window',
      'IPv4, IPv6 & CIDR Subnet Calculation',
      'Distance Vector & Link State Routing',
      'TCP 3-Way Handshake & Congestion Control',
      'HTTP/HTTPS, DNS Resolution & DHCP'
    ]
  },
  // 11. Data Structures
  {
    name: 'Data Structures',
    category: 'Programming',
    applicableExams: ['Data Structures', 'Software Engineering', 'GATE', 'Interview Prep'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Linear and non-linear data structures: arrays, linked lists, stacks, trees, graphs, and hashes.',
    icon: 'Binary',
    chapters: [
      'Arrays & Strings',
      'Linked Lists',
      'Stacks & Queues',
      'Trees & Binary Search Trees',
      'Heaps & Priority Queues',
      'Hash Tables',
      'Graphs & Representations'
    ],
    topics: [
      'Static vs Dynamic Memory Allocation',
      'Singly, Doubly & Circular Linked Lists',
      'Stack Push/Pop & Queue FIFO Operations',
      'BST Inorder/Preorder/Postorder Traversal',
      'Min Heap & Max Heap Operations',
      'Collision Resolution (Chaining vs Open Addressing)',
      'Adjacency Matrix & Adjacency List'
    ]
  },
  // 12. Algorithms
  {
    name: 'Algorithms',
    category: 'Programming',
    applicableExams: ['Algorithms', 'Software Engineering', 'GATE', 'Interview Prep'],
    applicableGrades: ['Class 11', 'Class 12', 'College', 'B.Tech', 'BCA', 'MCA', 'Not Applicable'],
    description: 'Algorithm design techniques: divide & conquer, greedy, dynamic programming, and graph algorithms.',
    icon: 'GitBranch',
    chapters: [
      'Asymptotic Analysis (Big-O)',
      'Searching & Sorting Algorithms',
      'Divide and Conquer',
      'Greedy Algorithms',
      'Dynamic Programming',
      'Graph Algorithms (BFS, DFS, Shortest Path)',
      'Backtracking'
    ],
    topics: [
      'Time & Space Complexity Metrics',
      'QuickSort, MergeSort & Binary Search',
      'Merge Sort & Quick Select Principles',
      'Knapsack Problem & Huffman Coding',
      'Memoization, Tabulation & Longest Common Subsequence',
      'Dijkstra, Prim & Kruskal Algorithms',
      'N-Queens & Sudoku Solver Algorithms'
    ]
  }
];

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('[Seeder] Seeding default Subjects, Chapters, and Topics catalog...');

    // Clear old catalog data to ensure clean state matching exact requirements
    await Subject.deleteMany({});
    await Chapter.deleteMany({});
    await Topic.deleteMany({});

    // Ensure default Admin & Student users exist
    const adminExists = await User.findOne({ email: 'admin@edubridge.ai' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@edubridge.ai',
        password: 'AdminPassword123!',
        role: 'admin',
        examTarget: 'JEE Main',
        gradeClass: 'Class 12'
      });
      console.log('[Seeder] Default Admin user created (admin@edubridge.ai)');
    }

    const studentExists = await User.findOne({ email: 'student@edubridge.ai' });
    if (!studentExists) {
      await User.create({
        name: 'Alex Student',
        email: 'student@edubridge.ai',
        password: 'StudentPassword123!',
        role: 'student',
        examTarget: 'JEE Main',
        gradeClass: 'Class 12'
      });
      console.log('[Seeder] Default Student user created (student@edubridge.ai)');
    }

    // Populate catalog
    for (const subItem of seedDataCatalog) {
      const createdSubject = await Subject.create({
        name: subItem.name,
        category: subItem.category,
        applicableExams: subItem.applicableExams,
        applicableGrades: subItem.applicableGrades,
        description: subItem.description,
        icon: subItem.icon
      });

      // Populate Chapters for this subject
      if (subItem.chapters && subItem.chapters.length > 0) {
        for (const chapName of subItem.chapters) {
          await Chapter.create({
            subject: createdSubject._id,
            name: chapName,
            description: `Core chapter covering ${chapName} in ${subItem.name}.`
          });
        }
      }

      // Populate Topics for this subject
      if (subItem.topics && subItem.topics.length > 0) {
        for (const topName of subItem.topics) {
          await Topic.create({
            subject: createdSubject._id,
            name: topName,
            description: `Key topic covering ${topName} concepts.`
          });
        }
      }
    }

    console.log('[Seeder] Database catalog successfully seeded with all default Subjects, Chapters, and Topics!');
    return { success: true };
  } catch (err) {
    console.error('[Seeder Error]:', err.message);
    throw err;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
