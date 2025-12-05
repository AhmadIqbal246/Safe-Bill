"""Feedback app package.

Avoid importing tasks here to prevent Django AppRegistryNotReady errors during
management commands (Celery already imports tasks via CELERY_IMPORTS).
"""
