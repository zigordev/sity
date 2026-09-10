export interface CameraView {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_VIEWS: CameraView[] = [
  { id: "overview", label: "Overview", position: [160, 3050, 2500], target: [-180, 0, 0] },
  { id: "downtown", label: "Downtown", position: [420, 520, 260], target: [260, 0, -180] },
  { id: "street", label: "Street level", position: [250, 14, -120], target: [246, 6, -200] },
  { id: "interchange", label: "Interchange", position: [760, 380, 60], target: [640, 0, -280] },
  { id: "roundabouts", label: "Roundabouts", position: [280, 380, 900], target: [120, 0, 690] },
  { id: "riverside", label: "Riverside", position: [300, 420, 560], target: [200, 0, 250] },
  { id: "bridge", label: "River bridge", position: [820, 240, 420], target: [610, 10, 230] },
  { id: "tunnel", label: "Tunnel", position: [420, 330, -560], target: [125, 30, -672] },
  { id: "mountain-road", label: "Mountain road", position: [200, 520, -100], target: [-180, 60, -330] },
  { id: "port", label: "Port", position: [700, 400, -900], target: [520, 0, -640] },
  { id: "beach", label: "Beach", position: [1000, 420, 100], target: [780, 0, -150] },
  { id: "suburb", label: "Suburb", position: [60, 120, 720], target: [-20, 2, 580] },
  { id: "dam", label: "Dam", position: [-100, 320, 700], target: [-480, 30, 440] },
  { id: "station", label: "North station", position: [720, 170, -780], target: [560, 4, -920] },
  { id: "crossing", label: "Level crossing", position: [580, 55, -1090], target: [520, 3, -1000] },
  { id: "village", label: "Village", position: [580, 230, -1080], target: [450, 4, -1250] },
  { id: "hospital", label: "Hospital", position: [820, 170, -1060], target: [650, 4, -1190] },
  { id: "trumpet", label: "Trumpet", position: [720, 360, 640], target: [450, 5, 780] },
  { id: "motorway", label: "Motorway", position: [760, 420, 1520], target: [480, 3, 1260] },
  { id: "services", label: "Services", position: [560, 120, 1420], target: [390, 3, 1300] },
  { id: "col-road", label: "Col Road", position: [-560, 520, 280], target: [-1000, 80, 520] },
  { id: "valley", label: "Valley", position: [-420, 420, -120], target: [-800, 20, 330] },
  { id: "pier", label: "Pier", position: [900, 90, -40], target: [1010, 6, -190] },
];

export function findView(id: string) {
  return CAMERA_VIEWS.find((view) => view.id === id);
}
