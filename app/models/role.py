from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    REVIEWER = "REVIEWER"
    USER = "USER"
