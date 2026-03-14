/**
 * Lottie3DMapper — Maps Lottie animation data to Three.js 3D meshes
 *
 * Takes a Lottie JSON (2D vector animation) and creates a 3D representation
 * where each shape layer becomes an extruded mesh that can be animated.
 *
 * Features:
 *   - Extracts shape paths from Lottie layers
 *   - Converts Bezier curves to Three.js shapes
 *   - Extrudes 2D shapes into 3D meshes
 *   - Applies Lottie colors and transforms
 *   - Animates based on Lottie keyframes
 */

import * as THREE from 'three';

/**
 * Parse Lottie shape path data to THREE.Shape
 */
function lottiePathToShape(pathData) {
  if (!pathData?.v || !Array.isArray(pathData.v)) return null;

  const shape = new THREE.Shape();
  const vertices = pathData.v;
  const inTangents  = pathData.i || [];
  const outTangents = pathData.o || [];

  if (vertices.length === 0) return null;

  // Start point
  const [x0, y0] = vertices[0];
  shape.moveTo(x0, y0);

  // Draw curves
  for (let i = 1; i < vertices.length; i++) {
    const [x, y]       = vertices[i];
    const [ox, oy]     = outTangents[i - 1] || [0, 0];
    const [ix, iy]     = inTangents[i] || [0, 0];
    const [px, py]     = vertices[i - 1];

    // Cubic bezier curve
    const cp1x = px + ox;
    const cp1y = py + oy;
    const cp2x = x + ix;
    const cp2y = y + iy;

    shape.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  // Close if needed
  if (pathData.c) {
    const [x, y]   = vertices[0];
    const [ox, oy] = outTangents[vertices.length - 1] || [0, 0];
    const [ix, iy] = inTangents[0] || [0, 0];
    const [px, py] = vertices[vertices.length - 1];

    const cp1x = px + ox;
    const cp1y = py + oy;
    const cp2x = x + ix;
    const cp2y = y + iy;

    shape.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  return shape;
}

/**
 * Extract color from Lottie fill/stroke
 */
function lottieColorToHex(c) {
  if (!c?.k) return 0xcccccc;
  const [r, g, b] = c.k;
  return (Math.floor(r * 255) << 16) + (Math.floor(g * 255) << 8) + Math.floor(b * 255);
}

/**
 * Create 3D mesh from Lottie shape layer
 */
function createMeshFromLayer(layer, lottieData) {
  if (layer.ty !== 4) return null; // only shape layers

  const group = new THREE.Group();
  group.name = layer.nm || 'layer';

  // Extract shapes
  const shapes = layer.shapes || [];
  for (const shapeGroup of shapes) {
    if (shapeGroup.ty !== 'gr') continue; // only groups

    let pathData = null;
    let fillColor = 0xcccccc;
    let hasStroke = false;

    // Find path and fill in this group
    for (const item of shapeGroup.it || []) {
      if (item.ty === 'sh' && item.ks?.a === 0) {
        pathData = item.ks.k;
      }
      if (item.ty === 'fl') {
        fillColor = lottieColorToHex(item.c);
      }
      if (item.ty === 'st') {
        hasStroke = true;
      }
    }

    if (!pathData) continue;

    const shape = lottiePathToShape(pathData);
    if (!shape) continue;

    // Extrude into 3D
    const extrudeSettings = {
      depth: 5,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
      bevelSegments: 2,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
      color: fillColor,
      shininess: 30,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Apply layer transform
    if (layer.ks) {
      const ks = layer.ks;
      if (ks.p?.a === 0) {
        const [x, y] = ks.p.k;
        mesh.position.set(x - 256, -(y - 256), 0); // center at origin
      }
      if (ks.s?.a === 0) {
        const [sx, sy] = ks.s.k;
        mesh.scale.set(sx / 100, sy / 100, 1);
      }
      if (ks.r?.a === 0) {
        mesh.rotation.z = THREE.MathUtils.degToRad(ks.r.k);
      }
    }

    group.add(mesh);
  }

  return group;
}

/**
 * Main mapper: Lottie JSON → Three.js scene
 */
export class Lottie3DMapper {
  constructor(lottieJSON) {
    this.data = lottieJSON;
    this.scene = new THREE.Group();
    this.scene.name = 'LottieScene';

    this.animationMixers = [];
    this.clock = new THREE.Clock();

    this._build();
  }

  _build() {
    // Get precomp layers (nested scenes)
    const precomps = this.data.assets?.filter(a => a.layers) ?? [];
    const mainLayers = this.data.layers || [];

    // Process main layers
    for (const layer of mainLayers) {
      if (layer.ty === 0 && layer.refId) {
        // Reference to precomp
        const precomp = precomps.find(p => p.id === layer.refId);
        if (precomp) {
          const group = this._buildPrecomp(precomp);
          if (group) this.scene.add(group);
        }
      } else {
        const mesh = createMeshFromLayer(layer, this.data);
        if (mesh) this.scene.add(mesh);
      }
    }

    // Center and scale scene
    const box = new THREE.Box3().setFromObject(this.scene);
    const center = box.getCenter(new THREE.Vector3());
    this.scene.position.sub(center);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      this.scene.scale.multiplyScalar(200 / maxDim); // fit in ~200 units
    }
  }

  _buildPrecomp(precomp) {
    const group = new THREE.Group();
    group.name = precomp.nm || 'precomp';

    for (const layer of precomp.layers || []) {
      const mesh = createMeshFromLayer(layer, this.data);
      if (mesh) group.add(mesh);
    }

    return group;
  }

  /**
   * Animate based on Lottie keyframes.
   * Currently simplified — maps position keyframes only.
   */
  update(deltaTime) {
    // Traverse and update animated properties
    this.scene.traverse((obj) => {
      if (obj.userData.lottieAnim) {
        const anim = obj.userData.lottieAnim;
        const t = (this.clock.getElapsedTime() * 30) % 150; // 30fps, 150 frames

        // Simple linear interpolation between keyframes
        if (anim.position) {
          const kf = this._getKeyframeValue(anim.position, t);
          if (kf) {
            obj.position.set(kf[0] - 256, -(kf[1] - 256), obj.position.z);
          }
        }
      }
    });
  }

  _getKeyframeValue(keyframes, time) {
    if (!keyframes || keyframes.length === 0) return null;
    if (!keyframes[0].t) return keyframes[0].s; // static

    // Find surrounding keyframes
    let k0 = keyframes[0];
    let k1 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].t <= time && keyframes[i + 1].t >= time) {
        k0 = keyframes[i];
        k1 = keyframes[i + 1];
        break;
      }
    }

    if (k0 === k1) return k0.s;

    // Linear interpolation
    const t = (time - k0.t) / (k1.t - k0.t);
    return [
      k0.s[0] + (k1.s[0] - k0.s[0]) * t,
      k0.s[1] + (k1.s[1] - k0.s[1]) * t,
    ];
  }

  getScene() {
    return this.scene;
  }

  dispose() {
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

export default Lottie3DMapper;
