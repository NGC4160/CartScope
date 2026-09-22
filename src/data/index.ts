import type { ManufacturerId, ModelPack, Powertrain } from "@/data/types";
import { applyShopTermsToPack } from "@/data/shop-terms";
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
import { ezgoExpressL6 } from "@/data/packs/ezgo-express-l6";
import { ezgoExpressS4 } from "@/data/packs/ezgo-express-s4";
import { ezgoExpressS6 } from "@/data/packs/ezgo-express-s6";
import { ezgoMarathonGas } from "@/data/packs/ezgo-marathon-gas";
import { ezgoPds36 } from "@/data/packs/ezgo-pds-36";
import { ezgoRxv } from "@/data/packs/ezgo-rxv";
import { ezgoTxt } from "@/data/packs/ezgo-txt";
import { ezgoTxt36NonPds } from "@/data/packs/ezgo-txt-36-non-pds";
import { ezgoTxtDcs } from "@/data/packs/ezgo-txt-dcs";
import { ezgoTxtGas } from "@/data/packs/ezgo-txt-gas";
import { yamahaG29 } from "@/data/packs/yamaha-g29";
import { starSirius } from "@/data/packs/star-sirius";
import { yamahaYdra } from "@/data/packs/yamaha-ydra";
import { yamahaYdreAc } from "@/data/packs/yamaha-ydre-ac";
import { yamahaYtf1 } from "@/data/packs/yamaha-ytf1";
import { tomberlinEmergeGe403 } from "@/data/packs/tomberlin-emerge-ge403";
import { tomberlinEmergeCurtis1268 } from "@/data/packs/tomberlin-emerge-curtis1268";
import { tomberlinEmergeSevcon } from "@/data/packs/tomberlin-emerge-sevcon";
import { evolutionAc } from "@/data/packs/evolution-ac";
import { evolutionD5 } from "@/data/packs/evolution-d5";
import { badboyCurtis1232e } from "@/data/packs/badboy-curtis-1232e";
import { badboyAmbushGas } from "@/data/packs/badboy-ambush-gas";
import { badboyAmbushElectric } from "@/data/packs/badboy-ambush-electric";
import { badboyRecoilIs } from "@/data/packs/badboy-recoil-is";
import { gemEseries2013 } from "@/data/packs/gem-eseries-2013";
import { trackerEvis2020 } from "@/data/packs/tracker-evis-2020";

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
  ezgoTxt36NonPds,
  ezgoPds36,
  ezgoTxt,
  ezgoRxv,
  ezgoExpressS4,
  ezgoExpressL6,
  ezgoExpressS6,
  ezgoTxtGas,
  ezgoMarathonGas,
  yamahaYdra,
  yamahaG29,
  yamahaYdreAc,
  yamahaYtf1,
  starSirius,
  tomberlinEmergeGe403,
  tomberlinEmergeCurtis1268,
  tomberlinEmergeSevcon,
  evolutionAc,
  evolutionD5,
  badboyCurtis1232e,
  badboyAmbushGas,
  badboyAmbushElectric,
  badboyRecoilIs,
  gemEseries2013,
  trackerEvis2020,
].map((p) => applyShopTermsToPack(p));

export const MANUFACTURERS: { id: ManufacturerId; label: string; blurb: string }[] = [
  {
    id: "club-car",
    label: "Club Car",
    blurb: "Older DS carts, Precedent, Tempo, and gas engines.",
  },
  {
    id: "ezgo",
    label: "EZ-GO",
    blurb: "TXT, RXV, Express S4 / L6 / S6, and Marathon gas carts.",
  },
  {
    id: "yamaha",
    label: "Yamaha",
    blurb: "Drive / G29 gas and electric carts, plus YTF1.",
  },
  {
    id: "star",
    label: "Star EV",
    blurb: "Sirius body electrical and Star chassis (Curtis 1243).",
  },
  {
    id: "tomberlin",
    label: "Tomberlin",
    blurb: "EMerge GE403, Curtis 1268, and Sevcon Gen4.",
  },
  {
    id: "evolution",
    label: "Evolution",
    blurb: "AC Drive 1232SE and D5 lithium AC system.",
  },
  {
    id: "badboy",
    label: "Bad Boy",
    blurb: "Curtis 1232E/SE, Ambush gas / electric, and Recoil iS 72 V.",
  },
  {
    id: "gem",
    label: "GEM",
    blurb: "2013 e-Series e2 / e4 / e6 / eS / eL / eL XD.",
  },
  {
    id: "tracker",
    label: "Tracker",
    blurb: "2020 EViS 72 V (dual Curtis 1236).",
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
