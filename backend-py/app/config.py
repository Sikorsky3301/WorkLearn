from pathlib import Path
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings

# Anchored to this file's location, not the process's current working
# directory — pydantic-settings resolves a relative env_file against CWD at
# launch, so starting uvicorn from anywhere other than backend-py/ silently
# finds no .env and every setting falls back to its hardcoded default
# (empty API keys, etc.) with no error.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+asyncpg://postgres:password@localhost:5432/worklearn"
    )
    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    ai_provider: str = "anthropic"  # anthropic | gemini | groq
    frontend_url: str = "http://localhost:5173"
    port: int = 3001

    # Langfuse tracing — tracing is skipped entirely (no overhead, no log
    # noise) unless both keys are set. See app/services/langfuse_client.py.
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    # Langfuse's own docs/UI call this "Base URL" in some places and "Host"
    # (the actual Python SDK env var) in others — accept either env var name
    # so LANGFUSE_BASE_URL doesn't blow up startup with "extra_forbidden".
    langfuse_host: str = Field(
        default="https://cloud.langfuse.com",
        validation_alias=AliasChoices("LANGFUSE_HOST", "LANGFUSE_BASE_URL"),
    )

    # Sandbox: docker daemon must be installed on the host and the image
    # pre-built — see backend-py/sandboxes/README.md
    sandbox_image: str = "worklearn-sandbox-python:latest"
    sandbox_image_frontend: str = "worklearn-sandbox-frontend:latest"
    sandbox_timeout_seconds: int = 15
    sandbox_memory_limit: str = "256m"
    sandbox_cpu_limit: str = "0.5"

    # Sandbox runner: "docker" runs `docker run` on the host daemon (local
    # dev); "kubernetes" launches each submission as a Job in sandbox_namespace
    # (in-cluster deployment — see k8s/README.md).
    sandbox_runner: str = "docker"
    sandbox_namespace: str = "worklearn-sandbox"
    # Directory the backend mounts submission workdirs under (must be the same
    # underlying storage the sandbox_hostpath_dir node path resolves to).
    sandbox_shared_dir: str = "/sandbox-work"
    # Node-local path backing sandbox_shared_dir, used in the Job's hostPath
    # volume so sandbox pods see the same files (single-node assumption).
    sandbox_hostpath_dir: str = "/worklearn/sandbox-work"
    sandbox_startup_timeout_seconds: int = 30

    class Config:
        env_file = _ENV_FILE


settings = Settings()

# ── Skill Engine constants ────────────────────────────────────────────────────
# Every dict below is keyed by simulation_id first, task_id second — two
# simulations both number their tasks 1-5, so a bare task_id key would award
# one simulation's XP/skills (or task name) using the other's definitions.
# (See backend-py/app/routes/sandbox.py's SIM_TASK_IO/SIM_GRADERS for the
# same pattern applied to the sandbox/grading side.)

SIM_TASK_XP_AWARDS: dict[str, dict[int, int]] = {
    "da-job-sim": {
        0: 10,  # Onboarding
        1: 50,  # Task 1 — Clean the Data
        2: 80,  # Task 2 — Sales Report
        3: 90,  # Task 3 — RFM Segmentation
        4: 100,  # Task 4 — A/B Test Analysis
        5: 120,  # Task 5 — Executive Brief
    },
    "frontend-dev-sim": {
        0: 10,  # Onboarding
        1: 50,  # Task 1 — Landing Hero Section
        2: 80,  # Task 2 — Interactive Navigation
        3: 90,  # Task 3 — Fetch & Render Data
        4: 100,  # Task 4 — React Component
        5: 120,  # Task 5 — Task Manager App
    },
    "sales-crm-sim": {
        1: 40,   # Stage 1 — Lead Qualification
        2: 50,   # Stage 2 — Research
        3: 70,   # Stage 3 — Cold Outreach
        4: 100,  # Stage 4 — Discovery Call
        5: 90,   # Stage 5 — CRM Pipeline Management
        6: 100,  # Stage 6 — Objection Handling
        7: 80,   # Stage 7 — Proposal
        8: 120,  # Stage 8 — Close
    },
}

SIM_TASK_SKILL_AWARDS: dict[str, dict[int, dict[str, int]]] = {
    "da-job-sim": {
        1: {"sql": 10, "data_cleaning": 15},
        2: {"python": 15, "analytics": 20, "data_viz": 10},
        3: {"customer_analysis": 20, "segmentation": 15},
        4: {"statistics": 25, "hypothesis_testing": 20},
        5: {"communication": 15, "data_storytelling": 20},
    },
    "frontend-dev-sim": {
        1: {"html_css": 15, "accessibility": 10},
        2: {"javascript": 15, "accessibility": 10},
        3: {"javascript": 15, "async_data": 15},
        4: {"react": 20, "component_design": 15},
        5: {"react": 15, "state_management": 25},
    },
    "sales-crm-sim": {
        1: {"sales_research": 10, "crm_accuracy": 5},
        2: {"sales_research": 20},
        3: {"email_writing": 20, "communication": 10},
        4: {"discovery": 25, "communication": 15},
        5: {"crm_accuracy": 25},
        6: {"objection_handling": 25, "negotiation": 10},
        7: {"negotiation": 15, "communication": 10},
        8: {"closing": 25, "negotiation": 15},
    },
}

TARGET_ROLE_REQUIREMENTS: dict[str, dict[str, int]] = {
    "junior_da": {
        "sql": 60,
        "python": 50,
        "analytics": 60,
        "data_viz": 40,
        "statistics": 40,
        "communication": 50,
        "data_cleaning": 50,
        "customer_analysis": 30,
        "segmentation": 30,
        "hypothesis_testing": 35,
        "data_storytelling": 40,
    },
    "senior_da": {
        "sql": 80,
        "python": 75,
        "analytics": 85,
        "data_viz": 65,
        "statistics": 70,
        "communication": 70,
        "data_cleaning": 75,
        "customer_analysis": 60,
        "segmentation": 60,
        "hypothesis_testing": 65,
        "data_storytelling": 70,
    },
    "junior_frontend_dev": {
        "html_css": 60,
        "accessibility": 40,
        "javascript": 60,
        "async_data": 40,
        "react": 55,
        "component_design": 40,
        "state_management": 35,
    },
    "junior_sales_rep": {
        "sales_research": 40,
        "email_writing": 40,
        "discovery": 50,
        "crm_accuracy": 50,
        "objection_handling": 45,
        "negotiation": 40,
        "closing": 45,
        "communication": 55,
    },
}

SKILL_LABELS: dict[str, str] = {
    "sql": "SQL & Querying",
    "python": "Python for Data",
    "analytics": "Data Analytics",
    "data_viz": "Data Visualization",
    "statistics": "Statistical Analysis",
    "communication": "Communication",
    "data_cleaning": "Data Cleaning",
    "customer_analysis": "Customer Analysis",
    "segmentation": "Segmentation",
    "hypothesis_testing": "Hypothesis Testing",
    "data_storytelling": "Data Storytelling",
    "html_css": "HTML & CSS",
    "accessibility": "Accessibility",
    "javascript": "JavaScript",
    "async_data": "Async Data Fetching",
    "react": "React",
    "component_design": "Component Design",
    "state_management": "State Management",
    "sales_research": "Sales Research",
    "email_writing": "Email Writing",
    "discovery": "Discovery & Qualification",
    "crm_accuracy": "CRM Accuracy",
    "objection_handling": "Objection Handling",
    "negotiation": "Negotiation",
    "closing": "Closing",
}

SIM_TASK_NAMES: dict[str, dict[int, str]] = {
    "da-job-sim": {
        0: "Onboarding",
        1: "Task 1 — Clean the Data",
        2: "Task 2 — Sales Report",
        3: "Task 3 — RFM Segmentation",
        4: "Task 4 — A/B Test Analysis",
        5: "Task 5 — Executive Brief",
    },
    "frontend-dev-sim": {
        0: "Onboarding",
        1: "Task 1 — Landing Hero Section",
        2: "Task 2 — Interactive Navigation",
        3: "Task 3 — Fetch & Render Data",
        4: "Task 4 — React Component",
        5: "Task 5 — Task Manager App",
    },
    "sales-crm-sim": {
        1: "Stage 1 — Lead Qualification",
        2: "Stage 2 — Research",
        3: "Stage 3 — Cold Outreach",
        4: "Stage 4 — Discovery Call",
        5: "Stage 5 — CRM Pipeline Management",
        6: "Stage 6 — Objection Handling",
        7: "Stage 7 — Proposal",
        8: "Stage 8 — Close",
    },
}

QUIZ_BONUS_THRESHOLD = 80
QUIZ_BONUS_XP = 20
INACTIVITY_DAYS = 3
