import Phaser from "phaser";
import { previewPlacement } from "../../game/preview";
import {
  canPlace,
  type Card,
  type Player,
  type State,
} from "../../game/placement";
export class BoardScene extends Phaser.Scene {
  private drawing?: Phaser.GameObjects.Container;
  private overlay?: Phaser.GameObjects.Container;
  private previewIndex: number | null = null;
  constructor(
    private read: () => {
      state: State;
      player: Player;
      card: Card | undefined;
    },
    private place: (index: number) => void,
    private describe: (text: string) => void,
  ) {
    super("board");
  }
  create() {
    this.paint();
    this.input.on("gameout", () => this.preview(null));
  }
  preview(index: number | null) {
    this.previewIndex = index;
    this.overlay?.destroy(true);
    this.overlay = undefined;
    const { state, player, card } = this.read();
    const result =
      index === null || !card
        ? null
        : previewPlacement(state, player, card, index);
    if (!result || !card || !this.add) {
      this.describe("");
      return;
    }
    this.overlay = this.add.container().setDepth(10);
    const notes: string[] = [];
    for (const change of result.changes) {
      const i = change.index,
        cell = result.state.board[i];
      const x = 24 + (i % 5) * 144,
        y = 24 + Math.floor(i / 5) * 138;
      const position = "ABC"[Math.floor(i / 5)] + ((i % 5) + 1);
      const color = change.kind === "capture" ? 0xe2b29c : 0x93e3dc;
      const background = this.add
        .rectangle(x, y, 132, 126, 0x203f40, 0.88)
        .setOrigin(0)
        .setStrokeStyle(2, color);
      const text =
        change.kind === "placement"
          ? card.name + "\nPoder " + card.power
          : "●".repeat(cell.rank) +
            "\n" +
            (change.kind === "capture"
              ? "Captura"
              : change.kind === "rank"
                ? "+1 peão"
                : "Novo território");
      const label = this.add
        .text(x + 66, y + 55, text, {
          fontFamily: "Georgia",
          fontSize: "16px",
          color: "#b5e9df",
          align: "center",
          wordWrap: { width: 118 },
        })
        .setOrigin(0.5)
        .setAlpha(change.kind === "placement" ? 0.65 : 1);
      this.overlay.add([background, label]);
      notes.push(position + ": " + text.replaceAll("\n", ", "));
    }
    this.describe("Prévia — " + notes.join("; ") + ". Ainda não aplicada.");
  }
  paint() {
    if (!this.add) return;
    this.preview(null);
    this.drawing?.destroy(true);
    this.drawing = this.add.container();
    const { state, player, card } = this.read();
    state.board.forEach((cell, i) => {
      const x = 24 + (i % 5) * 144,
        y = 24 + Math.floor(i / 5) * 138;
      const legal = !!card && canPlace(state, player, card, i);
      const color =
        cell.owner === 0 ? 0x62cec9 : cell.owner === 1 ? 0xc99179 : 0x4c5358;
      const tile = this.add
        .rectangle(x, y, 132, 126, cell.unit ? 0x253438 : 0x172327)
        .setOrigin(0)
        .setStrokeStyle(legal ? 2 : 1, legal ? 0xd4b77e : color);
      tile
        .setInteractive({ useHandCursor: legal })
        .on("pointerdown", () => this.place(i))
        .on("pointerover", () => this.preview(i))
        .on("pointerout", () => {
          if (this.previewIndex === i) this.preview(null);
        });
      const coord = this.add.text(
        x + 10,
        y + 8,
        `${"ABC"[Math.floor(i / 5)]}${(i % 5) + 1}`,
        { fontSize: "12px", color: "#9caeac" },
      );
      const label = this.add
        .text(
          x + 66,
          y + 48,
          cell.unit
            ? cell.unit.name.replaceAll(" ", "\n")
            : "●".repeat(cell.rank) || "·",
          {
            fontFamily: "Georgia",
            fontSize: cell.unit ? "17px" : "22px",
            color: cell.owner === 1 ? "#e2b29c" : "#93e3dc",
            align: "center",
          },
        )
        .setOrigin(0.5, 0.3);
      const power = this.add
        .text(x + 110, y + 100, cell.unit ? String(cell.unit.power) : "", {
          fontFamily: "Georgia",
          fontSize: "22px",
          color: "#e8d7af",
        })
        .setOrigin(0.5);
      this.drawing!.add([tile, coord, label, power]);
    });
  }
}
