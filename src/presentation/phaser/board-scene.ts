import Phaser from "phaser";
import { cardArtFrame, cardDisplayName, cardImage } from "../card-art";
import { referenceCards } from "../../game/reference-cards";
import { boardCell, boardCard } from "../board-layout";
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
  private previousUnits: (string | null)[] = [];
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
  preload() {
    this.load.image("card-art", "/assets/board/card-cutouts.png");
    for (const card of referenceCards) this.load.image(card.id, card.image!);
  }
  create() {
    if (this.textures.exists("card-art")) {
      const texture = this.textures.get("card-art");
      const source = texture.getSourceImage();
      const width = Math.floor(source.width / 4);
      const height = Math.floor(source.height / 2);
      for (let i = 0; i < 8; i++)
        texture.add(
          i,
          0,
          (i % 4) * width,
          Math.floor(i / 4) * height,
          width,
          height,
        );
    }
    this.paint();
  }
  preview(index: number | null) {
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
      const { x, y, width, height } = boardCell(i);
      const position = "ABC"[Math.floor(i / 5)] + ((i % 5) + 1);
      const color = change.kind === "capture" ? 0xe2b29c : 0x93e3dc;
      const background = this.add
        .rectangle(x, y, width, height, 0x203f40, 0.78)
        .setOrigin(0)
        .setStrokeStyle(2, color);
      const text =
        change.kind === "placement"
          ? cardDisplayName(card.id, card.name) + "\nPoder " + card.power
          : "●".repeat(cell.rank) +
            "\n" +
            (change.kind === "capture"
              ? "Captura"
              : change.kind === "rank"
                ? "+1 peão"
                : change.kind === "destruction"
                  ? "Destruída"
                  : change.kind === "spawn"
                    ? cell.unit!.name
                    : change.kind === "power"
                      ? `Poder ${cell.unit!.power}`
                      : "Novo território");
      const label = this.add
        .text(x + width / 2, y + height / 2, text, {
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
      const { x, y, width, height } = boardCell(i);
      const legal = !!card && canPlace(state, player, card, i);
      const color =
        cell.owner === 0 ? 0x62cec9 : cell.owner === 1 ? 0xc99179 : 0x756c56;
      const tile = this.add
        .rectangle(x, y, width, height, 0x0c1b22, 0.16)
        .setOrigin(0)
        .setStrokeStyle(legal ? 2 : 1, legal ? 0xd4b77e : color);
      this.drawing!.add(tile);
      const inner = this.add
        .rectangle(x + 4, y + 4, width - 8, height - 8)
        .setOrigin(0)
        .setStrokeStyle(1, 0x9e8250, 0.25);
      this.drawing!.add(inner);
      const face = boardCard(i);
      const team = cell.owner === 1 ? 0x450d1d : 0x210f35;
      const reference = cell.unit && cardImage(cell.unit.id);
      if (cell.unit && reference && this.textures.exists(cell.unit.id)) {
        const art = this.add
          .image(face.x, face.y, cell.unit.id)
          .setOrigin(0)
          .setDisplaySize(face.width, face.height);
        this.drawing!.add(art);
        if (cell.unit.power !== cell.unit.basePower) {
          const livePower = this.add
            .circle(
              face.x + face.width * 0.82,
              face.y + face.height * 0.12,
              17,
              0x10191e,
            )
            .setStrokeStyle(1, 0xd4b77e);
          this.drawing!.add(livePower);
        }
      } else if (cell.unit && this.textures.exists("card-art")) {
        const top = cell.owner === 1 ? 0x7e2c3c : 0x533369;
        const frame = this.add
          .rectangle(face.x, face.y, face.width, face.height, team)
          .setOrigin(0)
          .setStrokeStyle(1, 0xc0a36c);
        const gradient = this.add.graphics();
        gradient
          .fillGradientStyle(top, top, team, team, 1, 1, 1, 1)
          .fillRect(face.x + 2, face.y + 2, face.width - 4, face.height - 4);
        const art = this.add
          .image(
            face.x + face.width / 2,
            face.y + face.height / 2,
            "card-art",
            cardArtFrame(cell.unit.id),
          )
          .setDisplaySize(face.width - 6, face.height - 6);
        const ribbon = this.add
          .rectangle(
            face.x + 3,
            face.y + face.height - 27,
            face.width - 6,
            24,
            team,
            0.92,
          )
          .setOrigin(0);
        const rank = this.add.text(
          face.x + 6,
          face.y + 7,
          "◆".repeat(cell.unit.rank),
          {
            fontFamily: "Georgia",
            fontSize: "12px",
            color: "#ffe6ac",
            stroke: "#0a0612",
            strokeThickness: 2,
          },
        );
        const medallion = this.add
          .circle(face.x + face.width - 16, face.y + 15, 12, team)
          .setStrokeStyle(1, 0xd4b77e);
        this.drawing!.add([frame, gradient, art, ribbon, rank, medallion]);
      }
      if (!cell.unit && cell.rank) {
        for (let rank = 0; rank < cell.rank; rank++) {
          const gem = this.add.graphics();
          const gx = x + width / 2 + (rank - (cell.rank - 1) / 2) * 21;
          gem
            .fillStyle(color, 0.9)
            .lineStyle(1, cell.owner === 1 ? 0xffd3b6 : 0xb7fff0);
          const points = [
            new Phaser.Geom.Point(gx, y + 87),
            new Phaser.Geom.Point(gx + 7, y + 100),
            new Phaser.Geom.Point(gx, y + 113),
            new Phaser.Geom.Point(gx - 7, y + 100),
          ];
          gem.fillPoints(points, true).strokePoints(points, true);
          gem.lineStyle(1, 0xffffff, 0.4).lineBetween(gx, y + 87, gx, y + 113);
          this.drawing!.add(gem);
        }
      }
      const label = this.add
        .text(
          face.x + face.width / 2,
          face.y + face.height - 25,
          cell.unit && !reference
            ? cardDisplayName(cell.unit.id, cell.unit.name)
            : "",
          {
            fontFamily: "Georgia",
            fontSize: "12px",
            color: cell.owner === 1 ? "#e2b29c" : "#93e3dc",
            align: "center",
            wordWrap: { width: 105 },
          },
        )
        .setOrigin(0.5, 0);
      const power = this.add
        .text(
          reference ? face.x + face.width * 0.82 : face.x + face.width - 16,
          reference ? face.y + face.height * 0.12 : face.y + 15,
          cell.unit && (!reference || cell.unit.power !== cell.unit.basePower)
            ? String(cell.unit.power)
            : "",
          {
            fontFamily: "Georgia",
            fontSize: "19px",
            color: "#e8d7af",
          },
        )
        .setOrigin(0.5);
      this.drawing!.add([label, power]);
      if (
        cell.unit &&
        this.previousUnits.length &&
        this.previousUnits[i] !== cell.unit.id &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const flash = this.add
          .rectangle(face.x, face.y, face.width, face.height, color, 0.45)
          .setOrigin(0)
          .setStrokeStyle(3, color);
        this.drawing!.add(flash);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 450,
          onComplete: () => flash.destroy(),
        });
      }
    });
    this.previousUnits = state.board.map((cell) => cell.unit?.id ?? null);
  }
}
