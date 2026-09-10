export type RoadClass =
  | "highway"
  | "ramp"
  | "arterial"
  | "collector"
  | "local"
  | "industrial"
  | "mountain"
  | "rural"
  | "service";

export type CenterMarking = "double-yellow" | "dashed-yellow" | "dashed-white" | "none";

export interface RoadClassSpec {
  laneWidth: number;
  outerShoulder: number;
  innerShoulder: number;
  medianWidth: number;
  medianKind: "barrier" | "planted" | "none";
  sidewalkWidth: number;
  speedKph: number;
  cornerRadius: number;
  edgeLine: boolean;
  centerMarking: CenterMarking;
  lightingSpacing: number;
  streetTrees: boolean;
}

export const ROAD_CLASSES: Record<RoadClass, RoadClassSpec> = {
  highway: {
    laneWidth: 3.7,
    outerShoulder: 2.6,
    innerShoulder: 0,
    medianWidth: 3.6,
    medianKind: "barrier",
    sidewalkWidth: 0,
    speedKph: 100,
    cornerRadius: 20,
    edgeLine: true,
    centerMarking: "none",
    lightingSpacing: 42,
    streetTrees: false,
  },
  ramp: {
    laneWidth: 4.2,
    outerShoulder: 1.4,
    innerShoulder: 1.4,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 0,
    speedKph: 50,
    cornerRadius: 14,
    edgeLine: true,
    centerMarking: "none",
    lightingSpacing: 0,
    streetTrees: false,
  },
  arterial: {
    laneWidth: 3.4,
    outerShoulder: 0,
    innerShoulder: 0,
    medianWidth: 3.2,
    medianKind: "planted",
    sidewalkWidth: 4.2,
    speedKph: 50,
    cornerRadius: 10,
    edgeLine: false,
    centerMarking: "none",
    lightingSpacing: 30,
    streetTrees: true,
  },
  collector: {
    laneWidth: 3.3,
    outerShoulder: 0,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 3.4,
    speedKph: 50,
    cornerRadius: 8,
    edgeLine: false,
    centerMarking: "dashed-white",
    lightingSpacing: 32,
    streetTrees: true,
  },
  local: {
    laneWidth: 3.0,
    outerShoulder: 0,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 2.4,
    speedKph: 30,
    cornerRadius: 6,
    edgeLine: false,
    centerMarking: "none",
    lightingSpacing: 36,
    streetTrees: false,
  },
  industrial: {
    laneWidth: 3.6,
    outerShoulder: 0.8,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 2.0,
    speedKph: 50,
    cornerRadius: 14,
    edgeLine: true,
    centerMarking: "dashed-white",
    lightingSpacing: 40,
    streetTrees: false,
  },
  mountain: {
    laneWidth: 3.2,
    outerShoulder: 0.9,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 0,
    speedKph: 40,
    cornerRadius: 8,
    edgeLine: true,
    centerMarking: "double-yellow",
    lightingSpacing: 0,
    streetTrees: false,
  },
  rural: {
    laneWidth: 3.3,
    outerShoulder: 0.9,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 0,
    speedKph: 80,
    cornerRadius: 10,
    edgeLine: true,
    centerMarking: "dashed-white",
    lightingSpacing: 0,
    streetTrees: false,
  },
  service: {
    laneWidth: 3.0,
    outerShoulder: 0,
    innerShoulder: 0,
    medianWidth: 0,
    medianKind: "none",
    sidewalkWidth: 0,
    speedKph: 30,
    cornerRadius: 5,
    edgeLine: false,
    centerMarking: "none",
    lightingSpacing: 0,
    streetTrees: false,
  },
};

export function roadTotalWidth(spec: RoadClassSpec, forward: number, backward: number) {
  const laneTotal = (forward + backward) * spec.laneWidth;
  const median = forward > 0 && backward > 0 ? spec.medianWidth : 0;
  const shoulders =
    spec.outerShoulder * 2 + (median > 0 ? spec.innerShoulder * 2 : 0);
  return laneTotal + median + shoulders;
}
