export type GroundPathPoint = {
  x: number;
  z: number;
};

export type RoadPathPoint = GroundPathPoint & {
  y: number;
};

export type LanePath = {
  id: string;
  roadId: string;
  direction: "clockwise" | "counterclockwise";
  laneIndex: number;
  centerOffsetM: number;
  points: RoadPathPoint[];
};

export type XZPlacement = {
  x: number;
  z: number;
};

export type XYZPlacement = XZPlacement & {
  y: number;
};

export type ScaledXYZPlacement = XYZPlacement & {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};

export type OrientedXYZPlacement = XYZPlacement & {
  rotationY: number;
};

export type ScaledOrientedXYZPlacement = OrientedXYZPlacement & {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};
