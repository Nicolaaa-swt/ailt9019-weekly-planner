"""Render planner time slots as a terminal grid with one column per day."""

import unicodedata


def _width(text):
    return sum(0 if unicodedata.combining(c) or unicodedata.category(c) in ('Cf', 'Cc') else
               2 if unicodedata.east_asian_width(c) in ('W', 'F') else 1
               for c in text)


def _padding(width, chinese=False):
    # Match CJK text with CJK spaces. This also avoids relying on two Latin
    # spaces matching the fallback Chinese font's glyph width in a terminal.
    if chinese:
        return '\u3000' * (width // 2) + ' ' * (width % 2)
    return ' ' * width


def _wrap(text, width):
    lines = ['']
    for char in text:
        if char in '\n\r\t':
            char = ' '
        elif unicodedata.category(char) in ('Cf', 'Cc'):
            # Strip terminal controls so task names cannot move the cursor.
            continue
        if _width(lines[-1] + char) > width:
            lines.append('')
        lines[-1] += char
    return lines


def print_schedule_grid(time_slots, language='chinese'):
    """Print all supplied slots, wrapping names without truncating them."""
    slots = list(time_slots)
    english = language == 'english'
    print('\n===== Weekly Schedule =====' if english else '\n===== 每周时间表 =====')
    if not slots:
        return
    dates = sorted({slot.start.date() for slot in slots})
    periods = sorted({(slot.start.time(), slot.end.time()) for slot in slots})
    lookup = {(slot.start.date(), slot.start.time(), slot.end.time()): slot
              for slot in slots}
    weekdays = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') if english else (
        '周一', '周二', '周三', '周四', '周五', '周六', '周日')
    headers = [f'{date:%m-%d} {weekdays[date.weekday()]}' for date in dates]
    widths = [11] + [max(12, _width(header)) for header in headers]
    border = '+' + '+'.join('-' * (width + 2) for width in widths) + '+'

    def row(cells):
        wrapped = [_wrap(str(cell), width) for cell, width in zip(cells, widths)]
        for index in range(max(map(len, wrapped))):
            parts = []
            for lines, width in zip(wrapped, widths):
                text = lines[index] if index < len(lines) else ''
                parts.append(' ' + text + _padding(width - _width(text), not english) + ' ')
            print('|' + '|'.join(parts) + '|')

    print(border)
    row(['Time' if english else '时间'] + headers)
    print(border)
    for start, end in periods:
        cells = [f'{start:%H:%M}-{end:%H:%M}']
        for date in dates:
            slot = lookup.get((date, start, end))
            if slot is None:
                text = ''
            elif slot.unavailable:
                text = 'Busy' if english else '忙碌'
            elif slot.task:
                text = slot.task.name
            else:
                text = 'Free' if english else '空闲'
            cells.append(text)
        row(cells)
    print(border)
