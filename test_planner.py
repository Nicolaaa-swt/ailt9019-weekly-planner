import io
import unittest
from contextlib import redirect_stdout
from datetime import datetime

from planner import Task, WeeklyPlanner


class WeeklyPlannerTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 10, 25, 9)
        self.planner = WeeklyPlanner(self.start)

    def test_week_runs_from_0900_to_2200_for_seven_days(self):
        self.assertEqual(self.planner.time_slots[0].start, datetime(2026, 10, 25, 9))
        self.assertEqual(self.planner.time_slots[-1].end, datetime(2026, 10, 31, 22))
        self.assertEqual(len(self.planner.time_slots), 7 * 26)

    def test_busy_period_marks_overlapping_half_hour_slots(self):
        self.planner.add_busy_by_day_index(1, "10:30", "12:00")
        busy_slots = [slot for slot in self.planner.time_slots if slot.unavailable]
        self.assertEqual(len(busy_slots), 3)
        self.assertEqual(busy_slots[0].start, datetime(2026, 10, 25, 10, 30))
        self.assertEqual(busy_slots[-1].end, datetime(2026, 10, 25, 12))

    def test_fractional_task_uses_exact_number_of_slots(self):
        task = Task("Write report", 1.5, datetime(2026, 10, 25, 12), 1)
        unscheduled = self.planner.schedule([task])
        task_slots = [slot for slot in self.planner.time_slots if slot.task is task]
        self.assertEqual(len(task_slots), 3)
        self.assertEqual(unscheduled, [])

    def test_incomplete_task_is_reported_and_shown(self):
        task = Task("Large task", 2, datetime(2026, 10, 25, 10), 1)
        unscheduled = self.planner.schedule([task])
        self.assertEqual(unscheduled, [(task, 1.0)])

        output = io.StringIO()
        with redirect_stdout(output):
            self.planner.show()
        self.assertIn("Large task: 1 hour(s) could not be scheduled", output.getvalue())

    def test_invalid_busy_period_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "between 1 and 7"):
            self.planner.add_busy_by_day_index(8, "10:00", "11:00")
        with self.assertRaisesRegex(ValueError, "within 09:00-22:00"):
            self.planner.add_busy_by_day_index(1, "08:00", "10:00")

    def test_duration_must_match_slot_size(self):
        task = Task("Too precise", 0.25, datetime(2026, 10, 25, 12), 1)
        with self.assertRaisesRegex(ValueError, "30-minute increments"):
            self.planner.schedule([task])


if __name__ == "__main__":
    unittest.main()
