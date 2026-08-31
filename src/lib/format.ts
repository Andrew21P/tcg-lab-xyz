/** Re-export 2026–27 Standard format of record. */
export {
  FORMAT_ID,
  FORMAT_NAME,
  LEGAL_MARKS,
  ROTATION,
  BANNED_CARD_IDS,
  TOURNAMENT_WAITING_DAYS,
  FORMAT_RULES,
  isMarkLegal,
  isCardStandardLegal,
} from "../../data/format/standard-2026";
export type { RegulationMark } from "../../data/format/standard-2026";

import * as FORMAT_MODULE from "../../data/format/standard-2026";
export const FORMAT = FORMAT_MODULE;
