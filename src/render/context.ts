import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import * as THREE from "three";
import { POSTPROCESS_AO_SCALE } from "../config/constants";
import { mainBoundaryCenterX } from "../world/frame";

export const canvas = document.querySelector<HTMLCanvasElement>("#scene");

if (!canvas) {
  throw new Error("Canvas element #scene was not found.");
}

export const urlParams = new URLSearchParams(window.location.search);

export const viewTarget = new THREE.Vector3(mainBoundaryCenterX + 120, 0, 0);

export const animationClock = new THREE.Clock();

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: urlParams.has("verify"),
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 0.92;

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const textureLoader = new THREE.TextureLoader();

export const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("/assets/sity/decoders/draco/gltf/");

export const ktx2Loader = new KTX2Loader();

ktx2Loader.setTranscoderPath("/assets/sity/decoders/basis/");

ktx2Loader.detectSupport(renderer);

export const gltfLoader = new GLTFLoader();

gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.setKTX2Loader(ktx2Loader);

gltfLoader.setMeshoptDecoder(MeshoptDecoder);

export const scene = new THREE.Scene();

scene.background = new THREE.Color(0xb8d7e6);

scene.fog = new THREE.Fog(0xb8d7e6, 9_500, 18_500);

export const pmremGenerator = new THREE.PMREMGenerator(renderer);

export const environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

scene.environment = environmentMap;

scene.environmentIntensity = 0.58;

export const naturalElements = new THREE.Group();

naturalElements.name = "natural-elements";

scene.add(naturalElements);

export const artificialElements = new THREE.Group();

artificialElements.name = "artificial-elements";

scene.add(artificialElements);

export const cityElements = new THREE.Group();
cityElements.name = "city-elements";
scene.add(cityElements);

export const vegetationElements = new THREE.Group();
vegetationElements.name = "vegetation-elements";
scene.add(vegetationElements);

export const roadElements = new THREE.Group();

roadElements.name = "road-elements";

scene.add(roadElements);

export const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  2.5,
  20_000,
);

camera.position.set(viewTarget.x - 400, 3_150, 4_300);

camera.lookAt(viewTarget);

export const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;

controls.dampingFactor = 0.06;

controls.minDistance = 6;

controls.maxDistance = 7_500;

controls.maxPolarAngle = Math.PI * 0.495;

controls.target.copy(viewTarget);

export const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8dbb86, 1.55);

scene.add(hemisphereLight);

export const sunLight = new THREE.DirectionalLight(0xffffff, 2.25);

sunLight.position.set(-1_600, 2_800, 1_800);

sunLight.castShadow = true;

sunLight.shadow.mapSize.set(2048, 2048);

sunLight.shadow.camera.left = -2_800;

sunLight.shadow.camera.right = 2_800;

sunLight.shadow.camera.top = 2_800;

sunLight.shadow.camera.bottom = -2_800;

sunLight.shadow.camera.near = 200;

sunLight.shadow.camera.far = 7_000;

sunLight.shadow.bias = -0.00008;

sunLight.shadow.normalBias = 1.5;

scene.add(sunLight);

export const sky = new Sky();

sky.name = "physical-atmosphere-sky";

sky.scale.setScalar(120_000);

export const skyUniforms = sky.material.uniforms;

skyUniforms.turbidity.value = 7.6;

skyUniforms.rayleigh.value = 1.85;

skyUniforms.mieCoefficient.value = 0.004;

skyUniforms.mieDirectionalG.value = 0.78;

skyUniforms.sunPosition.value.copy(sunLight.position).normalize();

scene.add(sky);

export const composer = new EffectComposer(renderer);

composer.setSize(window.innerWidth, window.innerHeight);

export const renderPass = new RenderPass(scene, camera);

composer.addPass(renderPass);

export const ssaoPass = new SSAOPass(
  scene,
  camera,
  window.innerWidth * POSTPROCESS_AO_SCALE,
  window.innerHeight * POSTPROCESS_AO_SCALE,
  16,
);

ssaoPass.kernelRadius = 12;

ssaoPass.minDistance = 0.0015;

ssaoPass.maxDistance = 0.18;

composer.addPass(ssaoPass);

export const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.08,
  0.34,
  0.82,
);

composer.addPass(bloomPass);

composer.addPass(new OutputPass());

export function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  ssaoPass.setSize(
    window.innerWidth * POSTPROCESS_AO_SCALE,
    window.innerHeight * POSTPROCESS_AO_SCALE,
  );
  bloomPass.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);
