from civic_platform.schemas import QuizQuestion


FEATURE_CATALOG = [
    {
        "id": "chat",
        "name": "Verified Civic Chat",
        "description": "Tool-grounded election Q&A with source citations and transparent reasoning.",
    },
    {
        "id": "readiness",
        "name": "Voter Readiness Score",
        "description": "Checklist scoring for EPIC, roll status, polling station, ID, and EVM familiarity.",
    },
    {
        "id": "journey",
        "name": "Personalized Voting Journey",
        "description": "Persona-aware election preparation steps for voters, NRIs, candidates, and volunteers.",
    },
    {
        "id": "booth",
        "name": "Polling Booth Guide",
        "description": "Step-by-step booth flow including accessibility and first-time voter guidance.",
    },
    {
        "id": "quiz",
        "name": "Election Knowledge Quiz",
        "description": "Civic literacy questions with explanations and scoring.",
    },
    {
        "id": "scenario",
        "name": "Scenario Simulator",
        "description": "Decision paths for common election problems and escalation routes.",
    },
    {
        "id": "analytics",
        "name": "Civic Engagement Insights",
        "description": "Non-sensitive usage insights for improving readiness and learning journeys.",
    },
]


QUIZ_BANK = [
    QuizQuestion(
        id="q_epic",
        question="What is EPIC commonly used for in Indian elections?",
        options=["Voter photo identity card", "Counting machine", "Candidate affidavit", "Polling booth map"],
        answer="Voter photo identity card",
        explanation="EPIC refers to the voter photo identity card used for voter identification.",
    ),
    QuizQuestion(
        id="q_mcc",
        question="Who enforces the Model Code of Conduct during elections?",
        options=["Election Commission of India", "Supreme Court only", "Finance Ministry", "Rajya Sabha Secretariat"],
        answer="Election Commission of India",
        explanation="The ECI enforces the MCC after election schedules are announced.",
    ),
    QuizQuestion(
        id="q_vvpat",
        question="What does VVPAT help a voter verify?",
        options=["The printed slip of the vote cast", "The winning candidate", "The voter list address", "The nomination form"],
        answer="The printed slip of the vote cast",
        explanation="VVPAT lets voters briefly view a paper slip corresponding to their vote.",
    ),
    QuizQuestion(
        id="q_form6",
        question="Which form is commonly associated with new voter registration?",
        options=["Form 6", "Form 8A", "Form 2B", "Form 26"],
        answer="Form 6",
        explanation="Form 6 is used for inclusion of names in the electoral roll for eligible citizens.",
    ),
    QuizQuestion(
        id="q_age",
        question="What is the standard minimum voting age in India?",
        options=["18 years", "16 years", "21 years", "25 years"],
        answer="18 years",
        explanation="Eligible Indian citizens can register to vote when they meet the age requirement.",
    ),
]


SCENARIOS = {
    "missing_name_on_roll": {
        "recommended_path": [
            "Check the electoral roll on the official voter portal.",
            "Search by EPIC number and by personal details to avoid spelling mismatch.",
            "If missing, use the appropriate correction or registration form before the deadline.",
            "Contact the Booth Level Officer or voter helpline for local verification.",
        ],
        "escalation": "Use Voter Helpline 1950 or the official ECI voter portal.",
        "official_source_hint": "voters.eci.gov.in",
    },
    "candidate_nomination": {
        "recommended_path": [
            "Confirm eligibility for the election type and constituency.",
            "Prepare nomination papers, affidavit, photographs, and security deposit.",
            "File within the notified nomination window before the Returning Officer.",
            "Track scrutiny and withdrawal deadlines after filing.",
        ],
        "escalation": "Contact the Returning Officer for constituency-specific filing requirements.",
        "official_source_hint": "eci.gov.in candidate handbook and Returning Officer notifications",
    },
    "model_code_violation": {
        "recommended_path": [
            "Record the time, place, and nature of the alleged violation.",
            "Avoid sharing unverified allegations publicly.",
            "Report through official ECI grievance channels or cVIGIL where available.",
            "Preserve evidence for election authorities.",
        ],
        "escalation": "Report to ECI/cVIGIL or the district election machinery.",
        "official_source_hint": "eci.gov.in MCC instructions",
    },
    "accessibility_at_booth": {
        "recommended_path": [
            "Confirm polling station details in advance.",
            "Check available assistance such as ramps, wheelchairs, or companion support.",
            "Carry accepted identification and arrive with extra time.",
            "Ask polling staff for assistance if needed.",
        ],
        "escalation": "Contact the local election office or voter helpline before poll day.",
        "official_source_hint": "ECI accessibility and SVEEP resources",
    },
}
