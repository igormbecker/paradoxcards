import {
  createMatch,
  playFromHand,
  confirmOpening,
  passTurn,
} from "../game/match";
import type { Player } from "../game/placement";
const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
export class PlacementController {
  state = createMatch(newSeed());
  place(player: Player, handIndex: number, index: number) {
    const result = playFromHand(this.state, player, handIndex, index);
    this.state = result.state;
    return result;
  }
  opening(player: Player, indices: number[]) {
    const result = confirmOpening(this.state, player, indices);
    this.state = result.state;
    return result;
  }
  pass() {
    const result = passTurn(this.state, this.state.turn);
    this.state = result.state;
    return result;
  }
  reset() {
    this.state = createMatch(newSeed());
  }
}
