export const makeCursor = (ch, line) => {
  return { ch, line };
};

export const offsetCursor = (cursor, chs = 0, lines = 0) => {
  return { ch: cursor.ch + chs, line: cursor.line + lines };
};

export const offsetRange = (range, chs = 0, lines = 0) => {
  const { anchor, head } = range;
  return { anchor: offsetCursor(anchor, chs, lines), head: offsetCursor(head, chs, lines) };
};

export const getCursorWithOffset = (cm, chs = 0, lines = 0) => {
  return offsetCursor(cm.getCursor(), chs, lines);
};

export const getCursorLine = cm => {
  const { line } = cm.getCursor();
  return cm.getLine(line);
};

export const getLineBeforeCursor = cm => {
  const cursor = cm.getCursor();
  const cursorLine = cm.getLine(cursor.line);
  return cursorLine.slice(0, cursor.ch);
};

export const mergeCursors = (...cursors) => {
  const mergeTwoCursors = (c1, c2) => {
    const ch = c1.ch + c2.ch >= 0 ? c1.ch + c2.ch : 0;
    const line = c1.line + c2.line >= 0 ? c1.line + c2.line : 0;
    return { ch, line };
  };

  return cursors.reduce(mergeTwoCursors, { ch: 0, line: 0 });
};
