"""Strict date and time validation shared by the command-line interfaces."""
from datetime import datetime
import re


DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M"
DATE_PATTERN = re.compile(r"\d{4}-\d{2}-\d{2}")
TIME_PATTERN = re.compile(r"(?:[01]\d|2[0-3]):[0-5]\d")


def parse_date_time(date_text, time_text):
    """Return a datetime only when both values use the documented format."""
    date_text = date_text.strip()
    time_text = time_text.strip()
    if not DATE_PATTERN.fullmatch(date_text) or not TIME_PATTERN.fullmatch(time_text):
        raise ValueError("date and time must use YYYY-MM-DD and HH:MM")
    return datetime.strptime(f"{date_text} {time_text}", f"{DATE_FORMAT} {TIME_FORMAT}")


def parse_time(time_text):
    """Return ``(hour, minute)`` for a strict 24-hour HH:MM value."""
    time_text = time_text.strip()
    if not TIME_PATTERN.fullmatch(time_text):
        raise ValueError("time must use HH:MM")
    parsed = datetime.strptime(time_text, TIME_FORMAT)
    return parsed.hour, parsed.minute
