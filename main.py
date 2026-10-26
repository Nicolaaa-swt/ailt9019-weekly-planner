"""Program menu and persistence for calendar-week schedules."""
from contextlib import redirect_stdout
from datetime import datetime, timedelta
import io
import math
from pathlib import Path
import tempfile

BASE_DIR = Path(__file__).resolve().parent
LANGUAGE_FILE = BASE_DIR / 'language.txt'
SCHEDULES_DIR = BASE_DIR / 'schedules'


def calendar_week_start(now=None):
    today = (now or datetime.now()).replace(hour=0, minute=0, second=0, microsecond=0)
    return today - timedelta(days=today.weekday())


def read_value(prompt, convert=int, valid=lambda value: True, language='english'):
    while True:
        try:
            value = convert(input(prompt).strip())
            if valid(value):
                return value
        except (ValueError, OverflowError):
            pass
        print('Invalid input. Please try again.' if language == 'english'
              else '输入无效，请重新输入。')


def valid_duration(value):
    return math.isfinite(value) and value > 0 and (value * 2).is_integer()


def select_language(force=False):
    try:
        saved = LANGUAGE_FILE.read_text(encoding='utf-8').strip().lower()
    except FileNotFoundError:
        saved = 'chinese'
    else:
        if not force and saved in ('chinese', 'english'):
            return saved
    if saved not in ('chinese', 'english'):
        saved = 'chinese'
    while True:
        choice = input(
            f'Language / 语言: 1=中文, 2=English [{saved}] (Enter to keep): '
        ).strip().lower()
        if not choice:
            language = saved
        elif choice in ('1', 'chinese', '中文', 'zh'):
            language = 'chinese'
        elif choice in ('2', 'english', 'en'):
            language = 'english'
        else:
            print('Please select 1 or 2 / 请选择 1 或 2。')
            continue
        LANGUAGE_FILE.write_text(language + '\n', encoding='utf-8')
        return language


def schedule_path(week_start):
    return SCHEDULES_DIR / f'{week_start:%Y-%m-%d}.txt'


def save_schedule(planner, path):
    # Collect the full output before touching the saved schedule.
    with redirect_stdout(io.StringIO()) as output:
        planner.show()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode='w', encoding='utf-8', dir=path.parent, delete=False
        ) as temporary:
            temporary_path = Path(temporary.name)
            temporary.write(output.getvalue())
        temporary_path.replace(path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def new_schedule(language, week_start):
    if language == 'english':
        from main_english import main as create_schedule
    else:
        from main_chinese import main as create_schedule
    planner = create_schedule(week_start)
    save_schedule(planner, schedule_path(week_start))


def main():
    language = select_language()
    while True:
        week_start = calendar_week_start()
        path = schedule_path(week_start)
        try:
            if not path.is_file():
                new_schedule(language, week_start)
            if language == 'english':
                print('\n===== Weekly Planner =====\n1. View schedule\n2. New schedule\n3. Change language\n4. Quit')
                choice = input('Choose an option (1-4): ').strip()
            else:
                print('\n===== 每周计划 =====\n1. 查看时间表\n2. 新建时间表\n3. 更改语言\n4. 退出')
                choice = input('请选择（1-4）：').strip()
            if choice == '1':
                print(path.read_text(encoding='utf-8'))
            elif choice == '2':
                new_schedule(language, week_start)
            elif choice == '3':
                language = select_language(force=True)
            elif choice == '4':
                return
            else:
                print('Please select 1-4.' if language == 'english' else '请选择1至4。')
        except OSError as exc:
            print(f'File error: {exc}' if language == 'english' else f'文件错误：{exc}')
            return


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print('\nGoodbye / 再见。')
