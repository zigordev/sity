export type DistrictKind = "downtown" | "midrise" | "residential" | "industrial" | "coast" | "westend" | "alpine";

export interface District {
  kind: DistrictKind;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface DistrictStyle {
  building: "tower" | "block" | "house" | "shed" | "hotel";
  lotWidth: [number, number];
  lotDepth: number;
  floors: [number, number];
  floorHeight: number;
  frontGap: number;
  maxRise?: number;
}

export type SpecialKind = "park" | "plaza" | "stadium" | "parking" | "school" | "church" | "station" | "hospital" | "green" | "services" | "golf" | "campsite" | "chairlift" | "sawmill" | "manor" | "coop" | "windfarm" | "garage";

export interface SpecialBlock {
  id: string;
  kind: SpecialKind;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const DISTRICTS: District[] = [
  { kind: "downtown", minX: 125, maxX: 455, minZ: -292, maxZ: -148 },
  { kind: "coast", minX: 655, maxX: 785, minZ: -570, maxZ: 1500 },
  { kind: "industrial", minX: 300, maxX: 840, minZ: -800, maxZ: -415 },
  { kind: "residential", minX: -180, maxX: 660, minZ: 425, maxZ: 600 },
  { kind: "residential", minX: -180, maxX: 360, minZ: 600, maxZ: 705 },
  { kind: "alpine", minX: -1300, maxX: -1120, minZ: 440, maxZ: 660 },
  { kind: "residential", minX: -2800, maxX: -2560, minZ: -690, maxZ: -370 },
  { kind: "residential", minX: -2880, maxX: -2740, minZ: 580, maxZ: 990 },
  { kind: "westend", minX: -180, maxX: 46, minZ: -200, maxZ: 320 },
  { kind: "midrise", minX: 20, maxX: 660, minZ: -440, maxZ: 340 },
  { kind: "residential", minX: 340, maxX: 505, minZ: -1400, maxZ: -1100 },
  { kind: "midrise", minX: 560, maxX: 745, minZ: -1060, maxZ: -930 },
];

export const DISTRICT_STYLES: Record<DistrictKind, DistrictStyle> = {
  downtown: { building: "tower", lotWidth: [26, 42], lotDepth: 36, floors: [9, 32], floorHeight: 3.6, frontGap: 2.5 },
  midrise: { building: "block", lotWidth: [18, 32], lotDepth: 26, floors: [4, 8], floorHeight: 3.2, frontGap: 2.5 },
  residential: { building: "house", lotWidth: [15, 21], lotDepth: 30, floors: [2, 2], floorHeight: 3.1, frontGap: 2.5 },
  industrial: { building: "shed", lotWidth: [48, 84], lotDepth: 62, floors: [1, 1], floorHeight: 9.5, frontGap: 6 },
  coast: { building: "hotel", lotWidth: [36, 58], lotDepth: 34, floors: [7, 14], floorHeight: 3.3, frontGap: 3 },
  westend: { building: "house", lotWidth: [14, 20], lotDepth: 26, floors: [2, 3], floorHeight: 3.1, frontGap: 2.5 },
  alpine: { building: "house", lotWidth: [14, 20], lotDepth: 16, floors: [2, 2], floorHeight: 3.0, frontGap: 2.0, maxRise: 6.5 },
};

export const SPECIAL_BLOCKS: SpecialBlock[] = [
  { id: "civic-plaza", kind: "plaza", minX: 138, maxX: 230, minZ: -262, maxZ: -170 },
  { id: "central-park", kind: "park", minX: 330, maxX: 442, minZ: 46, maxZ: 196 },
  { id: "harbour-arena", kind: "stadium", minX: 306, maxX: 428, minZ: -548, maxZ: -424 },
  { id: "king-street-parking", kind: "parking", minX: 249, maxX: 311, minZ: -262, maxZ: -178 },
  { id: "south-bank-school", kind: "school", minX: 228, maxX: 312, minZ: 532, maxZ: 630 },
  { id: "west-end-church", kind: "church", minX: -50, maxX: 30, minZ: -6, maxZ: 72 },
  { id: "north-station", kind: "station", minX: 500, maxX: 578, minZ: -968, maxZ: -862 },
  { id: "northfield-hospital", kind: "hospital", minX: 596, maxX: 664, minZ: -1300, maxZ: -1090 },
  { id: "village-green", kind: "green", minX: 436, maxX: 470, minZ: -1256, maxZ: -1190 },
  { id: "northfield-chapel", kind: "church", minX: 437, maxX: 469, minZ: -1302, maxZ: -1258 },
  { id: "western-services", kind: "services", minX: -2560, maxX: -2440, minZ: 1210, maxZ: 1300 },
  { id: "links-golf", kind: "golf", minX: 628, maxX: 738, minZ: 1250, maxZ: 1500 },
  { id: "south-campsite", kind: "campsite", minX: 150, maxX: 330, minZ: 1226, maxZ: 1400 },
  { id: "col-chairlift", kind: "chairlift", minX: -1290, maxX: -1250, minZ: 600, maxZ: 640 },
  { id: "pinewood-sawmill", kind: "sawmill", minX: -2900, maxX: -2810, minZ: -420, maxZ: -300 },
  { id: "brook-manor", kind: "manor", minX: -2530, maxX: -2400, minZ: 1030, maxZ: 1150 },
  { id: "millbrook-church", kind: "church", minX: -2866, maxX: -2834, minZ: 540, maxZ: 584 },
  { id: "millbrook-coop", kind: "coop", minX: -2760, maxX: -2690, minZ: 800, maxZ: 870 },
  { id: "hilltop-windfarm", kind: "windfarm", minX: -2330, maxX: -2230, minZ: 860, maxZ: 1260 },
  { id: "queen-street-garage", kind: "garage", minX: 335, maxX: 385, minZ: -250, maxZ: -190 },
];

export function districtAt(x: number, z: number): District | undefined {
  return DISTRICTS.find((district) => x >= district.minX && x <= district.maxX && z >= district.minZ && z <= district.maxZ);
}
