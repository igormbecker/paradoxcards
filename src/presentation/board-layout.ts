// One physical card measure, shared by hand, backs and board rendering.
export const CARD_WIDTH = 120;
export const CARD_HEIGHT = (CARD_WIDTH * 534) / 390;
export const CELL_WIDTH = CARD_WIDTH + 8;
export const CELL_HEIGHT = CARD_HEIGHT + 8;
export const BOARD_WIDTH = CELL_WIDTH * 5 + 24;
export const BOARD_HEIGHT = CELL_HEIGHT * 3 + 24;
export const TABLE_WIDTH = 1440;
export const TABLE_HEIGHT = 1040;
export const fanPosition = (
  index: number,
  count: number,
  width: number,
  alignEnd = false,
) => {
  const step = Math.min(
    CARD_WIDTH + 8,
    (width - CARD_WIDTH) / Math.max(1, count - 1),
  );
  const start = alignEnd
    ? width - CARD_WIDTH - Math.max(0, count - 1) * step
    : 0;
  return start + index * step;
};
export const handPosition = (
  index: number,
  count: number,
  portrait: boolean,
) => ({
  x: portrait ? (index % 6) * 128 : fanPosition(index, count, 1120),
  y: portrait
    ? Math.floor(index / 6) *
      Math.min(
        CARD_HEIGHT + 12,
        (350 - CARD_HEIGHT) / Math.max(1, Math.ceil(count / 6) - 1),
      )
    : 0,
});
export const fitTable = (width: number, height: number) => {
  const portrait = width < 700;
  const logicalWidth = portrait ? 800 : TABLE_WIDTH;
  const logicalHeight = portrait ? 1560 : TABLE_HEIGHT;
  return {
    width: logicalWidth,
    height: logicalHeight,
    scale: Math.min(width / logicalWidth, height / logicalHeight),
  };
};
export const boardCell = (index: number) => ({
  x: 12 + (index % 5) * CELL_WIDTH,
  y: 12 + Math.floor(index / 5) * CELL_HEIGHT,
  width: CELL_WIDTH,
  height: CELL_HEIGHT,
});
export const boardCard = (index: number) => {
  const cell = boardCell(index);
  return {
    x: cell.x + 4,
    y: cell.y + 4,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  };
};
