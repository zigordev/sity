export interface CameraView {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_VIEWS: CameraView[] = [
  { id: "overview", label: "Overview", position: [-300, 2600, 3400], target: [120, 0, 0] },
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
];

export function findView(id: string) {
  return CAMERA_VIEWS.find((view) => view.id === id);
}
