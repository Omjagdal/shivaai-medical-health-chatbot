"""
In-memory conversation memory service.
Stores chat history per session with automatic TTL-based cleanup.
"""

import logging
import time
import threading
from collections import defaultdict
from typing import Dict, List, Optional

from app.config import MAX_MEMORY_TURNS

logger = logging.getLogger(__name__)

# Sessions older than 1 hour are pruned
SESSION_TTL_SECONDS = 3600


class ConversationMemory:
    """
    Thread-safe in-memory conversation store keyed by session_id.
    Each session stores the last N turns as {role, content} dicts.
    """

    def __init__(self, max_turns: int = MAX_MEMORY_TURNS):
        self._store: Dict[str, List[dict]] = defaultdict(list)
        self._timestamps: Dict[str, float] = {}
        self._max_turns = max_turns
        self._lock = threading.Lock()

        # Start background cleanup thread
        self._cleanup_thread = threading.Thread(
            target=self._periodic_cleanup, daemon=True
        )
        self._cleanup_thread.start()

    def add_turn(
        self, session_id: str, user_message: str, assistant_message: str
    ) -> None:
        """Add a user-assistant turn to a session's history."""
        with self._lock:
            history = self._store[session_id]
            history.append({"role": "user", "content": user_message})
            history.append({"role": "assistant", "content": assistant_message})

            # Prune to max_turns (each turn = 2 messages)
            max_messages = self._max_turns * 2
            if len(history) > max_messages:
                self._store[session_id] = history[-max_messages:]

            self._timestamps[session_id] = time.time()

    def get_history(self, session_id: str) -> List[dict]:
        """Get conversation history for a session."""
        with self._lock:
            self._timestamps[session_id] = time.time()
            return list(self._store.get(session_id, []))

    def clear_session(self, session_id: str) -> None:
        """Clear a specific session's history."""
        with self._lock:
            self._store.pop(session_id, None)
            self._timestamps.pop(session_id, None)

    @property
    def active_sessions(self) -> int:
        """Return count of active sessions."""
        with self._lock:
            return len(self._store)

    def _periodic_cleanup(self) -> None:
        """Background thread that prunes expired sessions."""
        while True:
            time.sleep(300)  # Run every 5 minutes
            cutoff = time.time() - SESSION_TTL_SECONDS
            with self._lock:
                expired = [
                    sid
                    for sid, ts in self._timestamps.items()
                    if ts < cutoff
                ]
                for sid in expired:
                    del self._store[sid]
                    del self._timestamps[sid]
                if expired:
                    logger.info("Pruned %d expired sessions", len(expired))


# Module-level singleton
conversation_memory = ConversationMemory()
