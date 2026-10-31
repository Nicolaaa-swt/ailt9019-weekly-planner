import io
from contextlib import redirect_stdout
from datetime import datetime
import unittest
from unittest.mock import patch

from input_validation import parse_date_time, parse_time
import main_chinese
import main_english


class InputValidationTests(unittest.TestCase):
    def test_strict_date_and_time_formats(self):
        self.assertEqual(
            parse_date_time("2026-11-02", "09:30"),
            datetime(2026, 11, 2, 9, 30),
        )
        for date_text, time_text in [
            ("02/11/2026", "09:30"),
            ("2026-02-30", "09:30"),
            ("2026-11-02", "9:30"),
            ("2026-11-02", "24:00"),
            ("2026-11-02", "09:60"),
        ]:
            with self.subTest(date=date_text, time=time_text):
                with self.assertRaises(ValueError):
                    parse_date_time(date_text, time_text)

        self.assertEqual(parse_time("22:00"), (22, 0))
        for value in ("9:00", "09.00", "25:00", "not-a-time"):
            with self.subTest(time=value), self.assertRaises(ValueError):
                parse_time(value)

    def test_english_workflow_recovers_from_invalid_times(self):
        inputs = [
            "1", "1", "9am", "10:00", "1", "09:00", "10:00",
            "1", "Write report", "0.5", "02/11/2026", "5pm",
            "2026-11-02", "12:00", "1",
        ]
        with patch("builtins.input", side_effect=inputs), redirect_stdout(io.StringIO()) as output:
            planner = main_english.main(datetime(2026, 10, 26))

        text = output.getvalue()
        self.assertIn("Invalid busy period", text)
        self.assertIn("Invalid date or time", text)
        self.assertTrue(any(slot.task and slot.task.name == "Write report" for slot in planner.time_slots))

    def test_chinese_workflow_recovers_from_invalid_times(self):
        inputs = [
            "1", "1", "09:00", "wrong", "1", "09:00", "10:00",
            "1", "完成报告", "0.5", "2026-13-02", "12:00",
            "2026-11-02", "12:00", "1",
        ]
        with patch("builtins.input", side_effect=inputs), redirect_stdout(io.StringIO()) as output:
            planner = main_chinese.main(datetime(2026, 10, 26))

        text = output.getvalue()
        self.assertIn("忙碌时间无效", text)
        self.assertIn("日期或时间无效", text)
        self.assertTrue(any(slot.task and slot.task.name == "完成报告" for slot in planner.time_slots))


if __name__ == "__main__":
    unittest.main()
