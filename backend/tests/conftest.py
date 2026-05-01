import asyncio
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session", autouse=True)
def initialize_database():
    """Ensure all DB tables exist before tests run."""
    from database import init_db
    asyncio.get_event_loop_policy().new_event_loop()
    loop = asyncio.new_event_loop()
    loop.run_until_complete(init_db())
    loop.close()
