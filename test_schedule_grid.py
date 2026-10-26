import io
import unittest
from contextlib import redirect_stdout
from datetime import datetime

from planner import Task, WeeklyPlanner
from schedule_grid import _width


class ScheduleGridTests(unittest.TestCase):
    def test_mixed_chinese_names_wrap_and_borders_align(self):
        planner = WeeklyPlanner(datetime(2026, 10, 26))
        planner.add_busy_by_day_index(2, "09:00", "10:00")
        planner.schedule([Task("中文Report非常长的任务名称", 1,
                               datetime(2026, 10, 26, 12), 1)])
        with redirect_stdout(io.StringIO()) as output:
            planner.show()
        lines = output.getvalue().splitlines()
        positions = []
        for line in lines:
            if line.startswith("|"):
                positions.append([_width(line[:i]) for i, c in enumerate(line) if c == "|"])
        self.assertTrue(positions)
        self.assertTrue(all(p == positions[0] for p in positions))
        self.assertIn("\u3000", output.getvalue())
        self.assertIn("中文Report", output.getvalue())
        cells = [line.split("|")[2].strip() for line in lines if line.startswith("|")]
        self.assertIn("中文Report非常长的任务名称", "".join(cells))


if __name__ == "__main__":
    unittest.main()
