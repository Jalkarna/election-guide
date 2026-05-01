/**
 * Civic data library — all static reference data for ElectionGuide.
 *
 * Sources: Election Commission of India (eci.gov.in), Delimitation Commission,
 * Representation of the People Act 1950/1951, and Census of India.
 *
 * This module is intentionally free of external API calls so every page
 * renders reliably even when the backend is unavailable.
 */

// ─── Quiz ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
  topic: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What does EPIC stand for in Indian elections?",
    options: [
      "Electronic Photo Identity Card",
      "Election Photo Identity Card",
      "Essential Photo Identity Card",
      "Electoral Public Identity Card",
    ],
    correct: 1,
    explanation:
      "EPIC — Election Photo Identity Card — is the official voter identification document issued by the Election Commission of India (ECI). It is commonly called the Voter ID card.",
    topic: "Voter ID",
  },
  {
    id: 2,
    question: "What is the minimum age to be registered as a voter in India?",
    options: ["16 years", "18 years", "21 years", "25 years"],
    correct: 1,
    explanation:
      "Under Article 326 of the Constitution of India, every citizen who is not less than 18 years of age and is not disqualified is entitled to be registered as a voter.",
    topic: "Eligibility",
  },
  {
    id: 3,
    question: "What does VVPAT stand for?",
    options: [
      "Voter Verified Paper Audit Trail",
      "Verified Voting Paper Audit Track",
      "Voter Validated Paper Audit Trail",
      "Visual Voter Paper Audit Trail",
    ],
    correct: 0,
    explanation:
      "VVPAT — Voter Verified Paper Audit Trail — is a device attached to the EVM that prints a paper slip showing the candidate symbol, name, and serial number for 7 seconds so voters can verify their choice.",
    topic: "EVM / VVPAT",
  },
  {
    id: 4,
    question: "How many seats are there in the Lok Sabha?",
    options: ["525", "543", "545", "552"],
    correct: 1,
    explanation:
      "The Lok Sabha has 543 elected seats (530 from states and 13 from Union Territories). The 544th and 545th seats were historically for nominated Anglo-Indian members, a provision abolished in 2019.",
    topic: "Parliament",
  },
  {
    id: 5,
    question: "What is Form 6 used for?",
    options: [
      "Correcting errors in the electoral roll",
      "Applying for a postal ballot",
      "Registering as a new voter",
      "Filing a nomination for candidature",
    ],
    correct: 2,
    explanation:
      "Form 6 is the application form for fresh enrollment in the electoral roll. A citizen who has turned 18 or moved to a new constituency submits Form 6 to register as a voter.",
    topic: "Registration",
  },
  {
    id: 6,
    question: "What is the Model Code of Conduct (MCC)?",
    options: [
      "A law that governs electoral spending limits",
      "A set of guidelines for parties and candidates from poll announcement to result day",
      "The code of conduct for Election Commission officials",
      "Rules for media coverage of elections",
    ],
    correct: 1,
    explanation:
      "The MCC is a set of guidelines issued by the ECI that becomes operational from the date of election schedule announcement until counting day. It governs the conduct of political parties, candidates, and the government to ensure a level playing field.",
    topic: "Model Code of Conduct",
  },
  {
    id: 7,
    question: "What is NOTA in Indian elections?",
    options: [
      "National Official Tally Association",
      "None of the Above",
      "No Other Than Approved",
      "National Oversight for Transparent Administration",
    ],
    correct: 1,
    explanation:
      "NOTA — None of the Above — appears as the last option on the EVM. Introduced after a Supreme Court directive in 2013, it allows voters to formally reject all candidates. The candidate with the most votes still wins even if NOTA scores highest.",
    topic: "Voting Process",
  },
  {
    id: 8,
    question: "Which form is used to report a change of address within the same assembly constituency?",
    options: ["Form 6", "Form 7", "Form 8", "Form 8A"],
    correct: 3,
    explanation:
      "Form 8A is used to transpose an entry within the same assembly constituency due to a change of address. Form 8 is for correction of entries; Form 7 is for deletion; Form 6 is for new enrolment.",
    topic: "Registration",
  },
  {
    id: 9,
    question: "What is the role of the Election Commission of India (ECI)?",
    options: [
      "To conduct and supervise general elections, state elections, and by-elections",
      "To write election law and present it to Parliament",
      "To adjudicate election-related criminal cases",
      "To manage campaign finance for political parties",
    ],
    correct: 0,
    explanation:
      "The ECI is a constitutional body under Article 324 that superintends, directs, and controls the preparation of electoral rolls and the conduct of elections to Parliament, state legislatures, and the offices of President and Vice-President.",
    topic: "ECI",
  },
  {
    id: 10,
    question: "What is the purpose of the cVigil app?",
    options: [
      "To check your name on the electoral roll",
      "To find your polling booth location",
      "To report Model Code of Conduct violations in real time",
      "To apply for an absentee ballot",
    ],
    correct: 2,
    explanation:
      "cVigil is a citizen reporting app launched by the ECI that allows anyone to report MCC violations by uploading a photo or video. Complaints are geo-tagged and routed to the flying squad for action within 100 minutes.",
    topic: "Citizen Tools",
  },
]

// ─── Scenarios ───────────────────────────────────────────────────────────────

export interface ScenarioStep {
  action: string
  detail: string
}

export interface Scenario {
  id: string
  title: string
  icon: string
  category: string
  description: string
  steps: ScenarioStep[]
  documents: string[]
  helpline: string
  estimatedTime: string
  officialLink: string
}

export const ELECTION_SCENARIOS: Scenario[] = [
  {
    id: "name-missing-roll",
    title: "Name missing from electoral roll",
    icon: "📋",
    category: "Registration",
    description: "Your name is not found in the electoral roll even though you believed you were registered.",
    steps: [
      { action: "Check online first", detail: "Search electoralsearch.eci.gov.in using your name, EPIC number, or mobile number." },
      { action: "Locate correct roll", detail: "Your name may be in your old constituency if you recently moved. Check both." },
      { action: "File Form 6", detail: "If genuinely not registered, submit Form 6 at your Electoral Registration Officer (ERO) office or online at voters.eci.gov.in." },
      { action: "Track application", detail: "Use the reference number to track your Form 6 status online." },
      { action: "On election day fallback", detail: "If rolls are finalised and name is absent, you may file a complaint with the Returning Officer at your polling station." },
    ],
    documents: ["EPIC or Aadhaar card", "Proof of address (utility bill, bank statement)", "Passport-size photograph"],
    helpline: "1950",
    estimatedTime: "2–4 weeks for enrolment",
    officialLink: "https://voters.eci.gov.in/",
  },
  {
    id: "lost-voter-id",
    title: "Lost or damaged Voter ID card",
    icon: "🪪",
    category: "Documents",
    description: "Your EPIC has been lost, stolen, or is too damaged to use at the polling booth.",
    steps: [
      { action: "File police complaint (optional)", detail: "For a lost card, a complaint helps but is not mandatory for duplicate issuance." },
      { action: "Fill Form 002", detail: "Apply for a duplicate EPIC by visiting your ERO or through the Voter Helpline portal." },
      { action: "Submit supporting documents", detail: "Carry your Aadhaar, FIR copy (if filed), and one recent photograph." },
      { action: "Vote with alternative ID", detail: "On polling day, you can vote using any of the 12 alternative photo IDs: Aadhaar, Passport, Driving Licence, PAN card, MNREGS card, Pension document with photo, Smart Card from Labour Ministry, Health Insurance Smart Card, Passbook with photo from bank/post office, Service Identity Card, or Student Photo ID card." },
    ],
    documents: ["FIR copy (if stolen)", "Aadhaar card or Passport", "Recent passport-size photograph"],
    helpline: "1950",
    estimatedTime: "7–14 days for duplicate",
    officialLink: "https://voterportal.eci.gov.in/",
  },
  {
    id: "name-mismatch",
    title: "Name or date of birth mismatch",
    icon: "✏️",
    category: "Corrections",
    description: "Your name is spelled incorrectly on the electoral roll or your date of birth is wrong.",
    steps: [
      { action: "Check the error type", detail: "Minor spelling errors vs. completely wrong name require different approaches." },
      { action: "Fill Form 8", detail: "Download Form 8 from the ECI website or your ERO office. This is the correction form." },
      { action: "Attach supporting documents", detail: "Attach self-attested copies of documents proving the correct details." },
      { action: "Submit to ERO", detail: "Submit online at voters.eci.gov.in or physically to your ERO or AERO office." },
      { action: "Verify correction", detail: "After 2–4 weeks, verify the correction on electoralsearch.eci.gov.in." },
    ],
    documents: ["Birth certificate or passport (for DOB)", "School certificate or Aadhaar (for name)", "Current EPIC copy"],
    helpline: "1950",
    estimatedTime: "2–4 weeks",
    officialLink: "https://voterportal.eci.gov.in/",
  },
  {
    id: "address-change",
    title: "Changed address or constituency",
    icon: "🏠",
    category: "Registration",
    description: "You have moved to a new house in the same constituency or to a different constituency.",
    steps: [
      { action: "Same constituency", detail: "File Form 8A to update your address within the same assembly constituency." },
      { action: "Different constituency", detail: "File Form 7 to delete your old entry and Form 6 to enrol in the new constituency." },
      { action: "Gather address proof", detail: "Utility bill, bank statement, Aadhaar, or rent agreement of the new address." },
      { action: "Submit online or offline", detail: "Use voters.eci.gov.in for digital submission or visit the ERO of the new constituency." },
    ],
    documents: ["Proof of new address", "Current EPIC copy"],
    helpline: "1950",
    estimatedTime: "3–6 weeks",
    officialLink: "https://voters.eci.gov.in/",
  },
  {
    id: "nri-voting",
    title: "NRI / Overseas voter registration",
    icon: "✈️",
    category: "Special Voters",
    description: "You are an Indian citizen living abroad and want to vote in Indian elections.",
    steps: [
      { action: "Check eligibility", detail: "Indian citizens abroad (not naturalised in another country) can register as overseas voters under Section 20A of the Representation of the People Act." },
      { action: "Fill Form 6A", detail: "Download and fill Form 6A. This is the specific form for overseas voter registration." },
      { action: "Attach passport copy", detail: "A self-attested copy of relevant passport pages is mandatory." },
      { action: "Register at last Indian address", detail: "You enrol in the constituency of your last residence in India as mentioned in your passport." },
      { action: "Vote in person", detail: "Currently, overseas voters must be physically present in India and at their registered polling station to vote. Proxy/postal voting is not yet available for NRIs." },
    ],
    documents: ["Indian Passport (relevant pages)", "Address proof (if recent Indian address differs from passport)"],
    helpline: "1950",
    estimatedTime: "4–8 weeks",
    officialLink: "https://www.nvsp.in/",
  },
  {
    id: "pwd-voting",
    title: "Voting as a person with disability",
    icon: "♿",
    category: "Special Voters",
    description: "You have a disability and need to know about accessible voting provisions.",
    steps: [
      { action: "Mark disability in roll", detail: "Ensure your name in the electoral roll reflects your disability status (PwD flag). This helps the ECI arrange accessible polling stations." },
      { action: "Request accessible booth", detail: "PwD voters are assigned to ground-floor, accessible polling stations. Contact your ERO to confirm." },
      { action: "Home voting option", detail: "Senior citizens (85+) and PwD voters can request postal ballot or home-visit voting. Apply to the Returning Officer before the deadline." },
      { action: "Companion on polling day", detail: "A PwD voter who cannot vote independently may bring a companion of their choice (one companion per voter, 18 years or above)." },
      { action: "Wheelchairs and ramps", detail: "All polling stations must have ramps, wheelchairs (usually), and priority queues for PwD voters." },
    ],
    documents: ["EPIC or valid photo ID", "Disability certificate (for postal ballot application)"],
    helpline: "1950 or 14431 (Divyangjan helpline)",
    estimatedTime: "Immediate on polling day",
    officialLink: "https://www.eci.gov.in/accessible-election/",
  },
  {
    id: "evm-vvpat",
    title: "Understanding EVM and VVPAT",
    icon: "🗳️",
    category: "Voting Process",
    description: "You want to understand how the Electronic Voting Machine and VVPAT work before polling day.",
    steps: [
      { action: "Ballot Unit (BU)", detail: "The blue BU has numbered buttons for each candidate. You press the button next to your chosen candidate's name and symbol." },
      { action: "Control Unit (CU)", detail: "The green CU is operated by the polling officer. It activates the BU once per voter after the officer presses 'Ballot'." },
      { action: "VVPAT verification", detail: "After pressing your choice on the BU, a paper slip appears in the transparent VVPAT window for 7 seconds. Confirm it shows your candidate's symbol and name." },
      { action: "What if VVPAT shows wrong candidate?", detail: "Inform the Presiding Officer immediately before the slip drops. Do not leave. You are entitled to a Tendered Vote slip to record the discrepancy." },
      { action: "No receipt", detail: "The paper slip automatically falls into the sealed VVPAT ballot box. You cannot take it. This maintains ballot secrecy." },
    ],
    documents: ["Valid photo ID (EPIC or 12 alternatives)"],
    helpline: "1950",
    estimatedTime: "2–3 minutes per voter",
    officialLink: "https://www.eci.gov.in/evm-vvpat/",
  },
  {
    id: "postal-ballot",
    title: "Postal ballot and absentee voting",
    icon: "📮",
    category: "Special Voters",
    description: "You cannot be at your polling station on election day and want to vote by post.",
    steps: [
      { action: "Check eligibility", detail: "Postal ballot is available for: service voters (armed forces, government employees abroad), voters on election duty, PwD voters, senior citizens (85+), and essential services voters (if notified)." },
      { action: "Apply in time", detail: "Submit Form 12D to the Returning Officer at least 5 days before the last date of withdrawal of nominations." },
      { action: "Receive ballot paper", detail: "The Returning Officer sends the ballot paper and Declaration Form to your registered address." },
      { action: "Mark and return", detail: "Mark your vote, sign the Declaration Form in the presence of an attesting officer (if service voter), seal everything, and post it back." },
      { action: "Deadline", detail: "The postal ballot must reach the Returning Officer before counting day. Late arrivals are not counted." },
    ],
    documents: ["Form 12D", "Service/Disability/Age proof as applicable"],
    helpline: "1950",
    estimatedTime: "Apply 2+ weeks before election",
    officialLink: "https://www.nvsp.in/",
  },
  {
    id: "complaint-filing",
    title: "Reporting an MCC violation or electoral malpractice",
    icon: "🚨",
    category: "Complaints",
    description: "You witnessed a Model Code of Conduct violation or electoral malpractice and want to report it.",
    steps: [
      { action: "Use cVigil app", detail: "Download the ECI cVigil app (Android/iOS). Report violations by uploading a photo or video. Reports are geo-tagged and reach the flying squad within 100 minutes." },
      { action: "Call Voter Helpline", detail: "Dial 1950 to report violations over the phone. Available in regional languages." },
      { action: "File written complaint", detail: "Submit a written complaint to the District Election Officer or Returning Officer." },
      { action: "What to capture", detail: "Photo/video of: distribution of cash or gifts, removal of EVM seals, booth capturing, defacement of public property, voter intimidation, violation of silence zone rules." },
    ],
    documents: ["Complaint with photo/video evidence (for cVigil)"],
    helpline: "1950",
    estimatedTime: "100 minutes response for cVigil",
    officialLink: "https://cvigil.eci.gov.in/",
  },
  {
    id: "first-time-voter",
    title: "First-time voter complete guide",
    icon: "🌟",
    category: "Guides",
    description: "You are voting for the first time and want a step-by-step walkthrough.",
    steps: [
      { action: "Verify you are registered", detail: "Check electoralsearch.eci.gov.in. If not registered, file Form 6 at voters.eci.gov.in." },
      { action: "Find your polling station", detail: "Search electoralsearch.eci.gov.in for your Polling Booth number and address." },
      { action: "Know the date and timing", detail: "Check the official schedule on eci.gov.in. Polling hours are typically 7:00 AM to 6:00 PM." },
      { action: "Carry your EPIC or alternative ID", detail: "EPIC is preferred. If lost, any of the 12 ECI-approved photo IDs works." },
      { action: "At the booth", detail: "Join the queue, give your name and EPIC number to the Polling Officer, get your finger inked, and press your choice on the EVM." },
      { action: "Verify VVPAT slip", detail: "Confirm the 7-second VVPAT slip shows your candidate's symbol before it drops into the sealed box." },
    ],
    documents: ["EPIC (Voter ID) or any one of 12 approved photo IDs"],
    helpline: "1950",
    estimatedTime: "Full day — start preparation 4 weeks before",
    officialLink: "https://voters.eci.gov.in/",
  },
  {
    id: "voter-id-correction",
    title: "Correcting details on your Voter ID card",
    icon: "📝",
    category: "Corrections",
    description: "Your EPIC has incorrect personal details that need to be corrected.",
    steps: [
      { action: "Identify the error", detail: "Compare your EPIC with your Aadhaar, passport, or birth certificate to identify the specific error." },
      { action: "Fill Form 8", detail: "This form is for correction of entries in the electoral roll. Fill it carefully with the correct details." },
      { action: "Self-attested documents", detail: "Attach self-attested proof documents for the correction — birth certificate for DOB, school certificate for name." },
      { action: "Submit to ERO/AERO", detail: "Submit Form 8 to your Electoral Registration Officer or Assistant ERO, or online at voters.eci.gov.in." },
      { action: "Collect corrected EPIC", detail: "Once verified and updated, collect your corrected EPIC from the ERO office or receive it by post." },
    ],
    documents: ["Birth certificate (for DOB correction)", "School leaving certificate / Aadhaar (for name)", "Existing EPIC copy"],
    helpline: "1950",
    estimatedTime: "4–6 weeks",
    officialLink: "https://voterportal.eci.gov.in/",
  },
  {
    id: "senior-citizen-voting",
    title: "Voting facilities for senior citizens",
    icon: "👴",
    category: "Special Voters",
    description: "You are 85 years or older and want to know about special voting provisions.",
    steps: [
      { action: "Home voting option", detail: "Voters 85 years or older can apply for facility to vote from home via Absentee Voter (postal ballot) option. Apply to the Returning Officer." },
      { action: "Accessible polling station", detail: "All polling stations must be on the ground floor. A ramp must be available." },
      { action: "Priority queue", detail: "Senior citizens have the right to priority queuing at polling stations." },
      { action: "Companion", detail: "A senior citizen who needs assistance may bring one companion." },
      { action: "Vehicle assistance", detail: "The ECI and state election machinery typically arrange vehicle assistance for senior voters. Check with your ERO." },
    ],
    documents: ["EPIC or valid photo ID", "Age proof for postal ballot application"],
    helpline: "1950",
    estimatedTime: "Same day",
    officialLink: "https://www.eci.gov.in/",
  },
  {
    id: "voter-roll-deletion",
    title: "Name wrongly deleted from electoral roll",
    icon: "❌",
    category: "Registration",
    description: "Your name was present in the roll previously but has been removed without your knowledge.",
    steps: [
      { action: "Confirm deletion", detail: "Check electoralsearch.eci.gov.in and confirm your name is not present in any nearby rolls either." },
      { action: "File Form 6 immediately", detail: "If name is genuinely deleted, file a fresh Form 6 for re-enrolment. Keep evidence of your previous registration." },
      { action: "File a grievance", detail: "Lodge a complaint at the National Voter Services Portal (nvsp.in) under 'Grievance'. Cite the previous EPIC number if you have it." },
      { action: "Contact ERO/AERO", detail: "Visit your ERO/AERO office with your previous EPIC (if available) and proof of residence." },
      { action: "On election day", detail: "If the roll is finalised and your name is absent, you can still file a formal challenge with the Presiding Officer at your booth." },
    ],
    documents: ["Previous EPIC copy (if available)", "Proof of residence", "Any earlier voter document"],
    helpline: "1950",
    estimatedTime: "Re-enrolment: 3–6 weeks",
    officialLink: "https://www.nvsp.in/",
  },
  {
    id: "duplicate-entry",
    title: "Duplicate entry in electoral roll",
    icon: "👥",
    category: "Registration",
    description: "Your name or another person's name appears more than once in the electoral roll.",
    steps: [
      { action: "Confirm duplication", detail: "Search electoralsearch.eci.gov.in for the person's name and EPIC number to verify multiple entries." },
      { action: "File Form 7", detail: "Form 7 is used to object to inclusion of a name or report duplication. Fill it with the details of the duplicate entry." },
      { action: "Submit to ERO", detail: "Submit Form 7 to the ERO of the constituency where the duplicate entry exists." },
      { action: "Provide evidence", detail: "Cite the EPIC numbers, serial numbers on the roll, and any other identifying information about the duplicate entry." },
    ],
    documents: ["Your EPIC copy", "Details of duplicate entry (EPIC number, serial number)"],
    helpline: "1950",
    estimatedTime: "2–4 weeks for deletion",
    officialLink: "https://voterportal.eci.gov.in/",
  },
  {
    id: "election-day-guide",
    title: "Step-by-step election day guide",
    icon: "📅",
    category: "Guides",
    description: "What to do from morning to evening on the day of polling.",
    steps: [
      { action: "Before leaving home", detail: "Confirm your polling station address (electoralsearch.eci.gov.in), carry your EPIC or alternate ID, and check that your finger is not already inked from any reason." },
      { action: "At the polling station", detail: "Join the queue. Polling opens at 7:00 AM. Your place in queue is secured even if polling closes — if you are in the queue before closing time, you must be allowed to vote." },
      { action: "Identity verification", detail: "The Polling Officer cross-checks your name in the electoral roll copy (Part) and verifies your ID. Sign or place thumb impression in the register." },
      { action: "Ink marking", detail: "Indelible ink is applied to the left index finger (or another finger if missing). This prevents double voting." },
      { action: "Casting your vote", detail: "Enter the screened booth. Press the button next to your chosen candidate on the EVM. You will hear a beep and a light turns on." },
      { action: "VVPAT verification", detail: "A paper slip appears in the VVPAT window for 7 seconds. Confirm it shows your candidate's symbol and name." },
    ],
    documents: ["EPIC or one of 12 ECI-approved photo IDs"],
    helpline: "1950",
    estimatedTime: "15–30 minutes at the booth",
    officialLink: "https://www.eci.gov.in/",
  },
  {
    id: "model-code-conduct",
    title: "Understanding the Model Code of Conduct",
    icon: "📜",
    category: "Rules",
    description: "What is the MCC, when does it apply, and what restrictions does it impose?",
    steps: [
      { action: "When it applies", detail: "The MCC comes into effect from the date the election schedule is announced by the ECI and remains until the counting is complete." },
      { action: "What it restricts", detail: "No new government schemes or announcements. No appointments or transfers of key officials. No use of government resources for campaigning." },
      { action: "Party and candidate rules", detail: "No communal or caste appeal. No bribery or distribution of gifts. Campaign must end 48 hours before polling day (silence period)." },
      { action: "What you can do", detail: "Political meetings, rallies, canvassing, and advertising are allowed within MCC rules. Parties must get permissions from local authorities for large gatherings." },
      { action: "Reporting violations", detail: "Use the cVigil app or call 1950. The flying squad must respond within 100 minutes." },
    ],
    documents: ["N/A (for voters)"],
    helpline: "1950",
    estimatedTime: "Applies throughout election period",
    officialLink: "https://www.eci.gov.in/model-code-of-conduct/",
  },
  {
    id: "transgender-voter",
    title: "Transgender voter registration and rights",
    icon: "🏳️",
    category: "Special Voters",
    description: "Rights and registration process for transgender and third-gender voters.",
    steps: [
      { action: "Gender option on Form 6", detail: "The voter registration Form 6 and EPIC include 'Others' as a gender option, alongside Male and Female. Transgender individuals can register under 'Others'." },
      { action: "Right to self-identification", detail: "As per the Supreme Court NALSA verdict and the Transgender Persons Act 2019, individuals have the right to self-identify their gender for registration purposes." },
      { action: "Change existing registration", detail: "To change gender on an existing roll entry, file Form 8 with a self-declaration of gender identity. A medical certificate is not mandatory." },
      { action: "Privacy at polling station", detail: "You have the right to be searched and assisted by a person of your identified gender. Polling officers must be sensitised — report violations to the Presiding Officer." },
      { action: "Helpline for issues", detail: "Contact the ECI Voter Helpline 1950 or file a grievance at nvsp.in if you face discrimination in registration or on polling day." },
    ],
    documents: ["Self-declaration of gender identity", "Proof of address and age"],
    helpline: "1950",
    estimatedTime: "Same as standard registration",
    officialLink: "https://voterportal.eci.gov.in/",
  },
  {
    id: "candidate-nomination",
    title: "Filing nomination as an election candidate",
    icon: "🏛️",
    category: "Candidature",
    description: "You want to contest an election and need to understand the nomination process.",
    steps: [
      { action: "Check eligibility", detail: "Must be an Indian citizen, minimum 25 years (Lok Sabha / state assembly), registered voter, and not disqualified under any law." },
      { action: "Obtain nomination form", detail: "Collect the official nomination form from the Returning Officer (RO) during the notified period, typically 1 week after schedule announcement." },
      { action: "Security deposit", detail: "Deposit ₹25,000 for general category (₹12,500 for SC/ST) for Lok Sabha; amounts vary for state elections. Deposited with the RO by bank draft." },
      { action: "Affidavit disclosure", detail: "File a mandatory sworn affidavit (Form 26) declaring criminal antecedents, assets, liabilities, and educational qualifications. Published on affidavit.eci.gov.in." },
      { action: "Proposers and scrutiny", detail: "10 registered voters from the constituency must sign as proposers (1 for parties). Nomination is scrutinised by RO on the specified day." },
    ],
    documents: ["Nomination form", "Form 26 (affidavit)", "Security deposit (bank draft)", "Passport photo", "Caste certificate (if SC/ST)"],
    helpline: "1950",
    estimatedTime: "1 week nomination window",
    officialLink: "https://affidavit.eci.gov.in/",
  },
  {
    id: "aadhaar-linking",
    title: "Linking Aadhaar with voter ID",
    icon: "🔗",
    category: "Documents",
    description: "The ECI's programme to voluntarily link Aadhaar with the electoral roll entry.",
    steps: [
      { action: "Is it mandatory?", detail: "Aadhaar-voter ID linking is voluntary as per the current legal position. You cannot be denied voting rights for not linking." },
      { action: "Why link?", detail: "Linking helps the ECI identify and remove duplicate entries from the roll, improving roll accuracy." },
      { action: "How to link", detail: "Visit voters.eci.gov.in or the Voter Helpline app. Select 'Aadhaar Collection' and enter your EPIC number and Aadhaar number. OTP verification is done on your Aadhaar-linked mobile." },
      { action: "Offline option", detail: "Fill Form 6B at your local ERO/AERO office or through a Booth Level Officer (BLO) visit." },
      { action: "After linking", detail: "No change to your voting experience — you still carry your EPIC to vote. Aadhaar is not used at the polling booth." },
    ],
    documents: ["EPIC number", "Aadhaar number", "Aadhaar-linked mobile number"],
    helpline: "1950",
    estimatedTime: "Instant online; 1–2 days for OTP verification",
    officialLink: "https://voters.eci.gov.in/",
  },
  {
    id: "no-documents-polling-day",
    title: "No photo ID on polling day — what to do",
    icon: "😟",
    category: "Guides",
    description: "You forgot or lost your ID documents before reaching the polling station.",
    steps: [
      { action: "Check all 12 alternatives", detail: "ECI accepts: Aadhaar, Passport, Driving Licence, PAN card, MNREGS Job Card with photo, Pension document with photo, Smart Card from Labour Ministry, Health Insurance Smart Card, Passbook with photo (bank/post office), Service Identity Card issued by Central/State Govt., Student Photo ID card from recognised institutions." },
      { action: "Return home if possible", detail: "If you live nearby, go back for a document — polling hours are typically 7 AM to 6 PM. You can vote any time during these hours." },
      { action: "Know your rights", detail: "If your name is in the roll, poll officers should make every effort to allow you to vote. Excessive restriction can be challenged with the Presiding Officer." },
      { action: "Tendered vote option", detail: "If another person has already voted in your name (impersonation), you can cast a 'Tendered Vote' which is kept separately and counted if an investigation proves fraud." },
      { action: "Report impersonation", detail: "Call 1950 or cVigil immediately if you discover someone has voted in your name." },
    ],
    documents: ["Any of the 12 ECI-approved photo IDs"],
    helpline: "1950",
    estimatedTime: "Immediate",
    officialLink: "https://www.eci.gov.in/",
  },
]

// ─── Readiness Checklist ─────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string
  title: string
  description: string
  category: string
  link?: string
  linkText?: string
}

export const READINESS_CHECKLIST: ChecklistItem[] = [
  {
    id: "epic",
    title: "EPIC (Voter ID) or accepted alternate ID is ready",
    description: "Carry your Election Photo Identity Card. If lost or unavailable, any one of the 12 ECI-approved photo IDs (Aadhaar, Passport, Driving Licence, PAN card, etc.) is accepted.",
    category: "Documents",
    link: "https://voters.eci.gov.in/",
    linkText: "Apply / Download EPIC",
  },
  {
    id: "roll-status",
    title: "Name confirmed in the electoral roll",
    description: "Verify your name, EPIC number, and polling station at electoralsearch.eci.gov.in. A name not in the roll means you cannot vote — check this well before election day.",
    category: "Verification",
    link: "https://electoralsearch.eci.gov.in/",
    linkText: "Search electoral roll",
  },
  {
    id: "polling-station",
    title: "Polling station location is known",
    description: "Find your exact polling booth address using the ECI voter search portal. Plan your route and estimate travel time, especially if using public transport.",
    category: "Logistics",
    link: "https://electoralsearch.eci.gov.in/",
    linkText: "Find polling station",
  },
  {
    id: "evm-knowledge",
    title: "EVM and VVPAT process is understood",
    description: "Know how the Ballot Unit, Control Unit, and VVPAT work. Practice with our interactive EVM simulator before polling day so there are no surprises at the booth.",
    category: "Knowledge",
    link: "/booth",
    linkText: "Try EVM simulator",
  },
  {
    id: "timing",
    title: "Polling date and timing noted",
    description: "Polling hours are typically 7:00 AM to 6:00 PM, though they can vary by constituency and state. Check the official notification for your exact schedule on eci.gov.in.",
    category: "Logistics",
    link: "https://www.eci.gov.in/",
    linkText: "Check ECI schedule",
  },
  {
    id: "accessibility",
    title: "Accessibility needs arranged (if applicable)",
    description: "Persons with disabilities are assigned ground-floor booths, priority queuing, and may bring one companion. Senior citizens (85+) may apply for home voting via postal ballot.",
    category: "Accessibility",
    link: "https://www.eci.gov.in/accessible-election/",
    linkText: "Accessible election guide",
  },
  {
    id: "silent-period",
    title: "Aware of the 48-hour silent period",
    description: "From 48 hours before polling to the end of polling, campaigning of any kind is prohibited — no political ads, rallies, or social media campaign posts. You can still freely vote.",
    category: "Rules",
  },
]

// ─── Journey personas ─────────────────────────────────────────────────────────

export interface JourneyStep {
  phase: string
  action: string
  deadline: string
  link?: string
}

export interface JourneyPersona {
  id: string
  label: string
  icon: string
  tagline: string
  steps: JourneyStep[]
}

export const JOURNEY_PERSONAS: JourneyPersona[] = [
  {
    id: "first-time",
    label: "First-time voter",
    icon: "🌟",
    tagline: "Turning 18 or voting for the first time? Here is your full preparation path.",
    steps: [
      { phase: "4+ weeks before", action: "Check if you are registered using your name and date of birth at electoralsearch.eci.gov.in", deadline: "ASAP", link: "https://electoralsearch.eci.gov.in/" },
      { phase: "4+ weeks before", action: "If not registered, file Form 6 online at voters.eci.gov.in. You must be 18 before the qualifying date.", deadline: "Before enrollment deadline", link: "https://voters.eci.gov.in/" },
      { phase: "2–3 weeks before", action: "Find your polling station address. Save the address and plan your route.", deadline: "Before election day", link: "https://electoralsearch.eci.gov.in/" },
      { phase: "1–2 weeks before", action: "Practice with our interactive EVM/VVPAT simulator so you know exactly what to do at the booth.", deadline: "Before election day", link: "/booth" },
      { phase: "1 week before", action: "Confirm your EPIC is in hand. If lost, apply for a duplicate or verify one of the 12 alternate IDs is ready.", deadline: "1 week before", link: "https://voters.eci.gov.in/" },
      { phase: "Election day", action: "Arrive at your polling station with your EPIC (or alternate ID). Join the queue, get inked, vote on EVM, verify VVPAT slip.", deadline: "Before polling closes", link: "/booth" },
    ],
  },
  {
    id: "returning",
    label: "Returning voter",
    icon: "🔄",
    tagline: "Voted before but want to make sure everything is in order for this election.",
    steps: [
      { phase: "3+ weeks before", action: "Re-confirm your name in the electoral roll — details can change between elections.", deadline: "Before rolls are finalised", link: "https://electoralsearch.eci.gov.in/" },
      { phase: "3+ weeks before", action: "If you moved addresses, update your constituency using Form 8A (same constituency) or Forms 6+7 (different constituency).", deadline: "Before enrollment deadline", link: "https://voters.eci.gov.in/" },
      { phase: "1–2 weeks before", action: "Check your EPIC is not expired or damaged. Apply for a duplicate if needed.", deadline: "1 week before", link: "https://voters.eci.gov.in/" },
      { phase: "Election day", action: "Carry your EPIC. Proceed to your polling station, verify your name at the entry, get inked, vote, and verify VVPAT.", deadline: "Before polling closes" },
    ],
  },
  {
    id: "nri",
    label: "NRI / Overseas voter",
    icon: "✈️",
    tagline: "Indian citizen living abroad? You can register and vote in Indian elections.",
    steps: [
      { phase: "Early preparation", action: "Confirm you are eligible: Indian citizen, not naturalised elsewhere, and have a valid Indian passport with last Indian address.", deadline: "ASAP" },
      { phase: "Registration", action: "Fill Form 6A online at nvsp.in. Attach self-attested copies of your passport. Register under the constituency of your last Indian address.", deadline: "Before enrollment deadline", link: "https://www.nvsp.in/" },
      { phase: "After registration", action: "Your name will appear on the roll as an overseas voter. Verify at electoralsearch.eci.gov.in once registered.", deadline: "After enrollment", link: "https://electoralsearch.eci.gov.in/" },
      { phase: "Election day", action: "You must be physically present at your registered polling station in India to vote. Plan your travel accordingly. Postal/proxy voting is not yet available for NRIs.", deadline: "Election day", link: "https://www.nvsp.in/" },
    ],
  },
  {
    id: "pwd",
    label: "Person with disability (PwD)",
    icon: "♿",
    tagline: "The ECI guarantees accessible, dignified voting for all persons with disabilities.",
    steps: [
      { phase: "Well before election", action: "Ensure your roll entry has the PwD flag. Contact your ERO to verify or update this status.", deadline: "Before rolls are finalised", link: "https://voters.eci.gov.in/" },
      { phase: "3+ weeks before", action: "If mobility is severely limited, apply to the Returning Officer for home-visit voting (postal ballot). Submit Form 12D before the deadline.", deadline: "Before nomination withdrawal deadline", link: "https://www.nvsp.in/" },
      { phase: "1 week before", action: "Confirm your assigned polling station is accessible (ground floor, ramp, wheelchair). Contact your ERO if it is not.", deadline: "1 week before" },
      { phase: "Election day", action: "Priority queue at the booth. You may bring one companion. Request assistance from the Presiding Officer if needed.", deadline: "Polling hours" },
    ],
  },
  {
    id: "senior",
    label: "Senior citizen (75+)",
    icon: "👴",
    tagline: "Special provisions ensure senior citizens can vote with ease and dignity.",
    steps: [
      { phase: "4+ weeks before", action: "Verify your name in the electoral roll at electoralsearch.eci.gov.in.", deadline: "Before rolls are finalised", link: "https://electoralsearch.eci.gov.in/" },
      { phase: "3+ weeks before", action: "If you are 85 or older, apply for the home-voting (postal ballot) facility by submitting Form 12D to the Returning Officer.", deadline: "Before nomination withdrawal", link: "https://www.nvsp.in/" },
      { phase: "1 week before", action: "If voting in person, confirm your polling station is ground-floor accessible. Check if your area has vehicle assistance from election authorities.", deadline: "1 week before" },
      { phase: "Election day", action: "Arrive at the booth. You have the right to priority queuing. Bring your EPIC or any accepted photo ID.", deadline: "Polling hours" },
    ],
  },
]

// ─── India electoral state data ───────────────────────────────────────────────

export interface StateData {
  name: string
  abbreviation: string
  zone: "North" | "South" | "East" | "West" | "Northeast" | "UT"
  lsSeats: number
  rsSeats: number
  assemblySeats: number
  registeredVoters: string
  lat: number
  lng: number
  eciLink: string
}

export const INDIA_STATES: StateData[] = [
  { name: "Andhra Pradesh", abbreviation: "AP", zone: "South", lsSeats: 25, rsSeats: 11, assemblySeats: 175, registeredVoters: "4.02 Cr", lat: 15.9129, lng: 79.74, eciLink: "https://ceoandhra.nic.in/" },
  { name: "Arunachal Pradesh", abbreviation: "AR", zone: "Northeast", lsSeats: 2, rsSeats: 1, assemblySeats: 60, registeredVoters: "9.48 L", lat: 28.218, lng: 94.7278, eciLink: "https://ceoarunachal.nic.in/" },
  { name: "Assam", abbreviation: "AS", zone: "Northeast", lsSeats: 14, rsSeats: 7, assemblySeats: 126, registeredVoters: "2.32 Cr", lat: 26.2006, lng: 92.9376, eciLink: "https://ceoassam.nic.in/" },
  { name: "Bihar", abbreviation: "BR", zone: "East", lsSeats: 40, rsSeats: 16, assemblySeats: 243, registeredVoters: "7.58 Cr", lat: 25.0961, lng: 85.3131, eciLink: "https://ceobihar.nic.in/" },
  { name: "Chhattisgarh", abbreviation: "CG", zone: "East", lsSeats: 11, rsSeats: 5, assemblySeats: 90, registeredVoters: "2.07 Cr", lat: 21.2787, lng: 81.8661, eciLink: "https://ceochhattisgarh.nic.in/" },
  { name: "Goa", abbreviation: "GA", zone: "West", lsSeats: 2, rsSeats: 1, assemblySeats: 40, registeredVoters: "11.5 L", lat: 15.2993, lng: 74.124, eciLink: "https://ceogoa.nic.in/" },
  { name: "Gujarat", abbreviation: "GJ", zone: "West", lsSeats: 26, rsSeats: 11, assemblySeats: 182, registeredVoters: "4.91 Cr", lat: 22.2587, lng: 71.1924, eciLink: "https://ceo.gujarat.gov.in/" },
  { name: "Haryana", abbreviation: "HR", zone: "North", lsSeats: 10, rsSeats: 5, assemblySeats: 90, registeredVoters: "1.98 Cr", lat: 29.0588, lng: 76.0856, eciLink: "https://ceoharyana.gov.in/" },
  { name: "Himachal Pradesh", abbreviation: "HP", zone: "North", lsSeats: 4, rsSeats: 3, assemblySeats: 68, registeredVoters: "56.2 L", lat: 31.1048, lng: 77.1734, eciLink: "https://himachal.nic.in/election/" },
  { name: "Jharkhand", abbreviation: "JH", zone: "East", lsSeats: 14, rsSeats: 6, assemblySeats: 81, registeredVoters: "2.60 Cr", lat: 23.6102, lng: 85.2799, eciLink: "https://www.jharkhandelection.nic.in/" },
  { name: "Karnataka", abbreviation: "KA", zone: "South", lsSeats: 28, rsSeats: 12, assemblySeats: 224, registeredVoters: "5.35 Cr", lat: 15.3173, lng: 75.7139, eciLink: "https://ceo.karnataka.gov.in/" },
  { name: "Kerala", abbreviation: "KL", zone: "South", lsSeats: 20, rsSeats: 9, assemblySeats: 140, registeredVoters: "2.77 Cr", lat: 10.8505, lng: 76.2711, eciLink: "https://www.ceo.kerala.gov.in/" },
  { name: "Madhya Pradesh", abbreviation: "MP", zone: "East", lsSeats: 29, rsSeats: 11, assemblySeats: 230, registeredVoters: "5.60 Cr", lat: 22.9734, lng: 78.6569, eciLink: "https://ceomadhyapradesh.nic.in/" },
  { name: "Maharashtra", abbreviation: "MH", zone: "West", lsSeats: 48, rsSeats: 19, assemblySeats: 288, registeredVoters: "9.28 Cr", lat: 19.7515, lng: 75.7139, eciLink: "https://ceo.maharashtra.gov.in/" },
  { name: "Manipur", abbreviation: "MN", zone: "Northeast", lsSeats: 2, rsSeats: 1, assemblySeats: 60, registeredVoters: "21.2 L", lat: 24.6637, lng: 93.9063, eciLink: "https://ceomanipur.nic.in/" },
  { name: "Meghalaya", abbreviation: "ML", zone: "Northeast", lsSeats: 2, rsSeats: 1, assemblySeats: 60, registeredVoters: "20.8 L", lat: 25.467, lng: 91.3662, eciLink: "https://ceomeghalaya.nic.in/" },
  { name: "Mizoram", abbreviation: "MZ", zone: "Northeast", lsSeats: 1, rsSeats: 1, assemblySeats: 40, registeredVoters: "8.57 L", lat: 23.1645, lng: 92.9376, eciLink: "https://ceomizoram.nic.in/" },
  { name: "Nagaland", abbreviation: "NL", zone: "Northeast", lsSeats: 1, rsSeats: 1, assemblySeats: 60, registeredVoters: "13.3 L", lat: 26.1584, lng: 94.5624, eciLink: "https://ceonicobar.nic.in/" },
  { name: "Odisha", abbreviation: "OD", zone: "East", lsSeats: 21, rsSeats: 10, assemblySeats: 147, registeredVoters: "3.47 Cr", lat: 20.9517, lng: 85.0985, eciLink: "https://ceoorissa.nic.in/" },
  { name: "Punjab", abbreviation: "PB", zone: "North", lsSeats: 13, rsSeats: 7, assemblySeats: 117, registeredVoters: "2.10 Cr", lat: 31.1471, lng: 75.3412, eciLink: "https://ceopunjab.nic.in/" },
  { name: "Rajasthan", abbreviation: "RJ", zone: "North", lsSeats: 25, rsSeats: 10, assemblySeats: 200, registeredVoters: "5.24 Cr", lat: 27.0238, lng: 74.2179, eciLink: "https://ceorajasthan.nic.in/" },
  { name: "Sikkim", abbreviation: "SK", zone: "Northeast", lsSeats: 1, rsSeats: 1, assemblySeats: 32, registeredVoters: "4.65 L", lat: 27.533, lng: 88.5122, eciLink: "https://sikkim.gov.in/departments/election-commission" },
  { name: "Tamil Nadu", abbreviation: "TN", zone: "South", lsSeats: 39, rsSeats: 18, assemblySeats: 234, registeredVoters: "6.23 Cr", lat: 11.1271, lng: 78.6569, eciLink: "https://www.elections.tn.gov.in/" },
  { name: "Telangana", abbreviation: "TS", zone: "South", lsSeats: 17, rsSeats: 7, assemblySeats: 119, registeredVoters: "3.22 Cr", lat: 18.1124, lng: 79.0193, eciLink: "https://www.ceotelangana.nic.in/" },
  { name: "Tripura", abbreviation: "TR", zone: "Northeast", lsSeats: 2, rsSeats: 1, assemblySeats: 60, registeredVoters: "28.6 L", lat: 23.9408, lng: 91.9882, eciLink: "https://ceotripura.nic.in/" },
  { name: "Uttar Pradesh", abbreviation: "UP", zone: "North", lsSeats: 80, rsSeats: 31, assemblySeats: 403, registeredVoters: "15.33 Cr", lat: 26.8467, lng: 80.9462, eciLink: "https://ceouttarpradesh.nic.in/" },
  { name: "Uttarakhand", abbreviation: "UA", zone: "North", lsSeats: 5, rsSeats: 3, assemblySeats: 70, registeredVoters: "82.9 L", lat: 30.0668, lng: 79.0193, eciLink: "https://ceouarakhand.nic.in/" },
  { name: "West Bengal", abbreviation: "WB", zone: "East", lsSeats: 42, rsSeats: 16, assemblySeats: 294, registeredVoters: "7.35 Cr", lat: 22.9868, lng: 87.855, eciLink: "https://www.ceowestbengal.nic.in/" },
  { name: "Delhi", abbreviation: "DL", zone: "UT", lsSeats: 7, rsSeats: 3, assemblySeats: 70, registeredVoters: "1.47 Cr", lat: 28.7041, lng: 77.1025, eciLink: "https://ceodelhi.gov.in/" },
  { name: "Jammu & Kashmir", abbreviation: "JK", zone: "UT", lsSeats: 5, rsSeats: 4, assemblySeats: 90, registeredVoters: "87.1 L", lat: 33.7782, lng: 76.5762, eciLink: "https://ceojammukashmir.nic.in/" },
  { name: "Chandigarh", abbreviation: "CH", zone: "UT", lsSeats: 1, rsSeats: 0, assemblySeats: 0, registeredVoters: "7.32 L", lat: 30.7333, lng: 76.7794, eciLink: "https://ceochandigarh.gov.in/" },
  { name: "Dadra & NH / D&D", abbreviation: "DN", zone: "UT", lsSeats: 2, rsSeats: 0, assemblySeats: 0, registeredVoters: "5.38 L", lat: 20.4283, lng: 72.8397, eciLink: "https://www.eci.gov.in/" },
  { name: "Lakshadweep", abbreviation: "LD", zone: "UT", lsSeats: 1, rsSeats: 0, assemblySeats: 0, registeredVoters: "63,870", lat: 10.5667, lng: 72.6417, eciLink: "https://www.eci.gov.in/" },
  { name: "Puducherry", abbreviation: "PY", zone: "UT", lsSeats: 1, rsSeats: 1, assemblySeats: 30, registeredVoters: "10.6 L", lat: 11.9416, lng: 79.8083, eciLink: "https://election.py.gov.in/" },
  { name: "Andaman & Nicobar", abbreviation: "AN", zone: "UT", lsSeats: 1, rsSeats: 0, assemblySeats: 0, registeredVoters: "3.24 L", lat: 11.7401, lng: 92.6586, eciLink: "https://andaman.gov.in/" },
  { name: "Ladakh", abbreviation: "LA", zone: "UT", lsSeats: 1, rsSeats: 0, assemblySeats: 0, registeredVoters: "1.87 L", lat: 34.1526, lng: 77.5771, eciLink: "https://www.eci.gov.in/" },
]

// ─── Official resources ───────────────────────────────────────────────────────

export interface ResourceLink {
  title: string
  description: string
  href: string
  category: string
  badge?: string
}

export const OFFICIAL_RESOURCES: ResourceLink[] = [
  {
    title: "Voter Registration Portal",
    description: "Register, update address, download EPIC, and link Aadhaar with your voter ID.",
    href: "https://voters.eci.gov.in/",
    category: "Registration",
    badge: "Official ECI",
  },
  {
    title: "Electoral Roll Search",
    description: "Search your name in the electoral roll, find your Polling Booth number and address.",
    href: "https://electoralsearch.eci.gov.in/",
    category: "Registration",
    badge: "Official ECI",
  },
  {
    title: "National Voters' Service Portal (NVSP)",
    description: "Apply for voter ID, track application status, file Form 6/7/8/8A, and grievances.",
    href: "https://www.nvsp.in/",
    category: "Registration",
    badge: "Official ECI",
  },
  {
    title: "Election Commission of India",
    description: "Official ECI website — election schedules, Model Code of Conduct, EVM information, and circulars.",
    href: "https://www.eci.gov.in/",
    category: "Authority",
    badge: "Official",
  },
  {
    title: "cVigil — Report MCC Violations",
    description: "ECI app to report Model Code of Conduct violations with photo/video. Flying squad responds within 100 minutes.",
    href: "https://cvigil.eci.gov.in/",
    category: "Complaints",
    badge: "Official ECI",
  },
  {
    title: "Candidate Affidavit Portal",
    description: "View compulsory disclosure affidavits of all election candidates — criminal records, assets, and liabilities.",
    href: "https://affidavit.eci.gov.in/",
    category: "Candidates",
    badge: "Transparency",
  },
  {
    title: "Election Results Archive",
    description: "Official election results, party-wise tally, and historical data for all Indian elections.",
    href: "https://results.eci.gov.in/",
    category: "Results",
    badge: "Official ECI",
  },
  {
    title: "Press Information Bureau",
    description: "Official government press releases and election-related announcements from ministries.",
    href: "https://www.pib.gov.in/",
    category: "News",
  },
  {
    title: "Sansad.in — Parliament of India",
    description: "Lok Sabha and Rajya Sabha seat distribution, member search, and parliamentary proceedings.",
    href: "https://sansad.in/",
    category: "Parliament",
  },
  {
    title: "Representation of the People Act",
    description: "The primary legislation governing elections in India — RP Act 1950 and RP Act 1951.",
    href: "https://www.indiacode.nic.in/",
    category: "Law",
    badge: "Legal",
  },
  {
    title: "SVEEP — Systematic Voters Education",
    description: "ECI's outreach programme for voter education, awareness materials, and accessibility guidelines.",
    href: "https://www.eci.gov.in/sveep/",
    category: "Education",
    badge: "ECI Programme",
  },
  {
    title: "State/UT Chief Electoral Officers",
    description: "Directory of all 36 state and UT election authority websites with local contact details.",
    href: "https://www.eci.gov.in/chief-electoral-officer/",
    category: "Authority",
  },
]
