"""Database router to send all reads/writes for the `receiving` app to the
`traceability_source` Postgres database.  This keeps the external table fully
isolated from Django's default DB and prevents accidental writes to SQLite in
local dev.

Any additional legacy apps that should point at the same database can be added
to the `app_labels` set below.
"""
from typing import Optional, Type
from django.db import models


class TraceabilityRouter:  # pylint: disable=too-few-public-methods
    """Route database operations for the `receiving` app."""

    app_labels = {"receiving"}

    # --- Primary helpers -------------------------------------------------
    def _is_traceability_model(self, model: Type[models.Model]) -> bool:  # noqa: D401
        """Return True if the given model belongs to an app that should hit the
        traceability_source DB. The check is done via the app label to avoid
        circular-import headaches.
        """

        return model._meta.app_label in self.app_labels  # type: ignore[attr-defined]

    # --- Django router API ----------------------------------------------
    def db_for_read(self, model: Type[models.Model], **hints) -> Optional[str]:
        if self._is_traceability_model(model):
            return "traceability_source"
        return None

    # Writes are extremely rare (ideally never) but route the same way so that
    # admin/manual data-fix scripts don't fall back to the wrong database.
    db_for_write = db_for_read  # type: ignore[assignment]

    def allow_relation(self, obj1, obj2, **hints):  # noqa: D401
        """Prevent cross-DB FK relations that Django cannot enforce."""
        if {obj1._state.db, obj2._state.db} <= {"traceability_source", "default"}:
            return True
        return None

    def allow_migrate(self, db: str, app_label: str, model_name: str | None = None, **hints):
        """Block migrations for traceability models – the table already exists."""
        if app_label in self.app_labels:
            return False
        return None
