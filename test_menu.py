import io
from contextlib import redirect_stdout
from datetime import datetime
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import main
from main import calendar_week_start


class MenuTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.week = datetime(2026, 10, 26)
        self.language = root / 'language.txt'
        self.schedules = root / 'schedules'
        self.path = self.schedules / '2026-10-26.txt'
        for name, value in [('LANGUAGE_FILE', self.language), ('SCHEDULES_DIR', self.schedules)]:
            patcher = patch.object(main, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        patcher = patch.object(main, 'calendar_week_start', return_value=self.week)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_menu(self, inputs):
        with patch('builtins.input', side_effect=inputs), redirect_stdout(io.StringIO()) as output:
            main.main()
        return output.getvalue()

    def test_calendar_week_across_year_boundary(self):
        self.assertEqual(calendar_week_start(datetime(2027, 1, 3, 18)), datetime(2026, 12, 28))

    def test_first_launch_creates_before_menu_and_reopens_saved_grid(self):
        output = self.run_menu(['2', 'bad', '-1', '0', '0', '1', '4'])
        self.assertEqual(self.language.read_text().strip(), 'english')
        saved = self.path.read_text()
        self.assertIn('10-26 Mon', saved)
        self.assertIn('11-01 Sun', saved)
        self.assertIn(saved, output)
        self.assertLess(output.index('Weekly Task Planner'), output.index('1. View schedule'))
        with patch('main_english.main', side_effect=AssertionError('Should use saved schedule')):
            output = self.run_menu(['invalid', '1', '4'])
        self.assertIn('Please select 1-4.', output)
        self.assertIn(saved, output)

    def test_language_switch_and_new_schedule_replace_saved_text(self):
        self.run_menu(['2', '0', '0', '4'])
        self.run_menu(['3', '1', '2', '0', '0', '4'])
        self.assertEqual(self.language.read_text().strip(), 'chinese')
        self.assertIn('每周时间表', self.path.read_text())
        self.assertEqual(list(self.schedules.iterdir()), [self.path])

    def test_interrupt_during_new_schedule_preserves_saved_file(self):
        self.run_menu(['2', '0', '0', '4'])
        saved = self.path.read_bytes()
        with self.assertRaises(KeyboardInterrupt):
            self.run_menu(['2', '0', KeyboardInterrupt()])
        self.assertEqual(self.path.read_bytes(), saved)

    def test_prior_week_does_not_skip_creation(self):
        self.schedules.mkdir()
        old = self.schedules / '2026-10-19.txt'
        old.write_text('old schedule')
        self.run_menu(['1', '0', '0', '4'])
        self.assertTrue(self.path.is_file())
        self.assertEqual(old.read_text(), 'old schedule')


if __name__ == '__main__':
    unittest.main()
