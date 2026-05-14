"""
Shared Rate Limiter instance for the API Gateway.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from utils.config import get_settings

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit_default],
)
