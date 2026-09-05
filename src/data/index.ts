import type { ManufacturerId, ModelPack, Powertrain } from "@/data/types";
import { clubCarDsElectric } from "@/data/packs/club-car-ds-electric";
import { clubCarDsFe290 } from "@/data/packs/club-car-ds-fe290";
import { clubCarDsGas } from "@/data/packs/club-car-ds-gas";
import { clubCarDsIq } from "@/data/packs/club-car-ds-iq";
import { clubCarDsPdPlus } from "@/data/packs/club-car-ds-pdplus";
import { clubCarDsVGlide } from "@/data/packs/club-car-ds-vglide";
import { clubCarPrecedent } from "@/data/packs/club-car-precedent";
import { clubCarPrecedentEric } from "@/data/packs/club-car-precedent-eric";
import { clubCarPrecedentExcel } from "@/data/packs/club-car-precedent-excel";
import { clubCarPrecedentGas } from "@/data/packs/club-car-precedent-gas";
import { clubCarTempoEric } from "@/data/packs/club-car-tempo-eric";
import { clubCarTempoGas } from "@/data/packs/club-car-tempo-gas";
import { clubCarVillagerGas } from "@/data/packs/club-car-villager-gas";
import { clubCarVillagerIqPlus } from "@/data/packs/club-car-villager-iqplus";
import { ezgoExpressS4 } from "@/data/packs/ezgo-express-s4";
import { ezgoMarathonGas } from "@/data/packs/ezgo-marathon-gas";
import { ezgoPds36 } from "@/data/packs/ezgo-pds-36";
import { ezgoRxv } from "@/data/packs/ezgo-rxv";
import { ezgoTxt } from "@/data/packs/ezgo-txt";
import { ezgoTxtDcs } from "@/data/packs/ezgo-txt-dcs";
import { ezgoTxtGas } from "@/data/packs/ezgo-txt-gas";
import { yamahaG29 } from "@/data/packs/yamaha-g29";
import { yamahaYdra } from "@/data/packs/yamaha-ydra";
import { yamahaYdreAc } from "@/data/packs/yamaha-ydre-ac";

export const MODEL_PACKS: ModelPack[] = [
  clubCarDsVGlide,
  clubCarDsElectric,
  clubCarDsPdPlus,
  clubCarDsIq,
  clubCarPrecedent,
  clubCarPrecedentExcel,
  clubCarVillagerIqPlus,
  clubCarPrecedentEric,
  clubCarTempoEric,
  clubCarDsFe290,
  clubCarDsGas,
  clubCarVillagerGas,
  clubCarPrecedentGas,
  clubCarTempoGas,
  ezgoTxtDcs,
  ezgoPds36,
  ezgoTxt,
  ezgoRxv,
  ezgoExpressS4,
  ezgoTxtGas,
  ezgoMarathonGas,
  yamahaYdra,
  yamahaG29,
  yamahaYdreAc,
];

export const MANUFACTURERS: { id: ManufacturerId; label: string; blurb: string }[] = [
  {
    id: "club-car",
    label: "Club Car",
    blurb: "Older DS carts, Precedent, Tempo, and gas engines.",
  },
  {
    id: "ezgo",
    label: "EZ-GO",
    blurb: "TXT, RXV, Express S4, and Marathon gas carts.",
  },
  {
    id: "yamaha",
    label: "Yamaha",
    blurb: "Drive / G29 gas and electric carts.",
  },
];

const PACK_ALIASES: Record<string, string> = {
  "ezgo-txt-pds": "ezgo-txt-tct",
  "yamaha-g29-drive": "yamaha-ydre-dc",
  "club-car-precedent-tempo-gas": "club-car-precedent-gas",
};

export function getPack(id: string): ModelPack | undefined {
  const resolved = PACK_ALIASES[id] ?? id;
  return MODEL_PACKS.find((p) => p.id === resolved);
}

export function packsFor(manufacturer: ManufacturerId): ModelPack[] {
  return MODEL_PACKS.filter((p) => p.manufacturer === manufacturer);
}

export function packsForPowertrain(manufacturer: ManufacturerId, powertrain: Powertrain): ModelPack[] {
  return packsFor(manufacturer).filter((p) => p.powertrain === powertrain);
}

export function getSymptom(pack: ModelPack, symptomId: string) {
  return pack.symptoms.find((s) => s.id === symptomId);
}
