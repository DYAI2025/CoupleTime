"""pytest configuration — add backend/ to sys.path for all test modules."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
