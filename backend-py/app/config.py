from pydantic_settings import BaseSettings


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

    # Sandbox: docker daemon must be installed on the host and the image
    # pre-built — see backend-py/sandboxes/README.md
    sandbox_image: str = "worklearn-sandbox-python:latest"
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
        env_file = ".env"


settings = Settings()

# ── Skill Engine constants ────────────────────────────────────────────────────

TASK_XP_AWARDS: dict[int, int] = {
    0: 10,  # Onboarding
    1: 50,  # Task 1 — Clean the Data
    2: 80,  # Task 2 — Sales Report
    3: 90,  # Task 3 — RFM Segmentation
    4: 100,  # Task 4 — A/B Test Analysis
    5: 120,  # Task 5 — Executive Brief
}

TASK_SKILL_AWARDS: dict[int, dict[str, int]] = {
    1: {"sql": 10, "data_cleaning": 15},
    2: {"python": 15, "analytics": 20, "data_viz": 10},
    3: {"customer_analysis": 20, "segmentation": 15},
    4: {"statistics": 25, "hypothesis_testing": 20},
    5: {"communication": 15, "data_storytelling": 20},
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
}

TASK_NAMES: dict[int, str] = {
    0: "Onboarding",
    1: "Task 1 — Clean the Data",
    2: "Task 2 — Sales Report",
    3: "Task 3 — RFM Segmentation",
    4: "Task 4 — A/B Test Analysis",
    5: "Task 5 — Executive Brief",
}

QUIZ_BONUS_THRESHOLD = 80
QUIZ_BONUS_XP = 20
INACTIVITY_DAYS = 3
