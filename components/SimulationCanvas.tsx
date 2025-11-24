import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  View, 
  PerspectiveCamera, 
  OrbitControls, 
  Environment, 
  Grid,
  TorusKnot, 
  Sphere, 
  Box,
  Text,
  Line,
  Cone,
  useGLTF,
  TransformControls
} from '@react-three/drei';
import * as THREE from 'three';
import { SimulationParams, ViewMode } from '../types';
import { Lock, Unlock, Move } from 'lucide-react';

interface SimulationCanvasProps {
  params: SimulationParams;
  viewMode: ViewMode;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
}

const getObjectDimensions = (type: string): [number, number, number] => {
  switch (type) {
    case 'cube': return [2, 2, 2];
    case 'sphere': return [3, 3, 3]; // r=1.5 -> d=3
    case 'torus': return [3, 3, 1.6]; // Approx bounds for TorusKnot(1, 0.3)
    case 'dna': return [2.5, 8, 0.5]; // Approx bounds
    default: return [2, 2, 2];
  }
};

// Reusable Bounding Box Component
const BoundingBoxOverlay = ({ 
  dims, 
  scale = 1, 
  color, 
  showLabels,
  labelScaleMultiplier = 1
}: { 
  dims: [number, number, number], 
  scale?: number, 
  color: string, 
  showLabels: boolean,
  labelScaleMultiplier?: number
}) => {
  const maxDim = Math.max(dims[0], dims[1], dims[2]);
  const labelSize = maxDim * 0.10 * labelScaleMultiplier;

  return (
    <group>
       <mesh>
          <boxGeometry args={dims} />
          <meshBasicMaterial color={color} wireframe />
       </mesh>
       
       {showLabels && (
          <group>
            <Text 
              position={[0, dims[1]/2 + labelSize * 0.5, dims[2]/2]} 
              rotation={[0, 0, 0]}
              fontSize={labelSize} 
              color={color} 
              anchorY="bottom"
              anchorX="center"
              outlineWidth={labelSize * 0.1}
              outlineColor="#000000"
            >
               {`宽: ${(dims[0] * scale).toFixed(2)}m`}
            </Text>
            
            <Text 
              position={[dims[0]/2 + labelSize * 0.5, 0, dims[2]/2]} 
              rotation={[0, 0, -Math.PI / 2]}
              fontSize={labelSize} 
              color={color} 
              anchorY="bottom"
              anchorX="center"
              outlineWidth={labelSize * 0.1}
              outlineColor="#000000"
            >
               {`高: ${(dims[1] * scale).toFixed(2)}m`}
            </Text>

             <Text 
               position={[dims[0]/2, -dims[1]/2 - labelSize * 0.5, 0]} 
               rotation={[0, -Math.PI / 2, 0]}
               fontSize={labelSize} 
               color={color} 
               anchorY="top"
               anchorX="center"
               outlineWidth={labelSize * 0.1}
               outlineColor="#000000"
            >
               {`深: ${(dims[2] * scale).toFixed(2)}m`}
            </Text>
          </group>
       )}
    </group>
  );
};

// Component to load and display custom GLB models
const CustomModel = ({ 
  url, 
  material, 
  onLoaded 
}: { 
  url: string, 
  material: THREE.Material, 
  onLoaded?: (dims: [number, number, number]) => void 
}) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => {
    const s = scene.clone();
    const box = new THREE.Box3().setFromObject(s);
    const center = box.getCenter(new THREE.Vector3());
    s.position.sub(center);
    
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
      }
    });
    return s;
  }, [scene, material]);

  useEffect(() => {
    if (onLoaded && clonedScene) {
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      onLoaded([size.x, size.y, size.z]);
    }
  }, [clonedScene, onLoaded]);

  return <primitive object={clonedScene} />;
};

// Reusable 3D Scene Content
const SceneContent = ({ 
  params, 
  isGodView = false,
  onParamChange 
}: { 
  params: SimulationParams, 
  isGodView?: boolean,
  onParamChange?: (updates: Partial<SimulationParams>) => void
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [customDims, setCustomDims] = useState<[number, number, number]>([2, 2, 2]);
  
  useFrame((state, delta) => {
    if (meshRef.current && !params.isPaused && !params.isViewLocked) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      
      // Removed !isGodView check so object animates in God View too
      meshRef.current.position.y = Math.sin(meshRef.current.rotation.y * 4) * 0.1; 
      meshRef.current.rotation.z = Math.sin(meshRef.current.rotation.y * 3) * 0.05;
    }
  });

  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#6366f1", 
    roughness: 0.2, 
    metalness: 0.8,
    wireframe: params.wireframe
  }), [params.wireframe]);

  const dims = params.objectType === 'custom' ? customDims : getObjectDimensions(params.objectType);

  const handleDragEnd = () => {
    if (meshRef.current && onParamChange) {
      const zOffset = meshRef.current.position.z;
      const newDistance = Math.max(0.5, params.targetDistance - zOffset);
      meshRef.current.position.set(0, 0, 0); 
      onParamChange({ targetDistance: newDistance });
    }
  };

  const ObjectContent = (
    <group ref={meshRef} scale={params.objectScale}>
      {params.objectType === 'torus' && (
        <TorusKnot args={[1, 0.3, 128, 32]} material={material} />
      )}
      {params.objectType === 'cube' && (
        <Box args={[2, 2, 2]} material={material} />
      )}
      {params.objectType === 'sphere' && (
        <Sphere args={[1.5, 64, 64]} material={material} />
      )}
      {params.objectType === 'dna' && (
          <group>
            {Array.from({ length: 10 }).map((_, i) => (
              <group key={i} position={[0, (i - 5) * 0.8, 0]} rotation={[0, i * 0.5, 0]}>
                <Sphere args={[0.2]} position={[1, 0, 0]} material={material} />
                <Sphere args={[0.2]} position={[-1, 0, 0]} material={material} />
                <Box args={[2, 0.05, 0.05]} material={material} />
              </group>
            ))}
          </group>
      )}
      {params.objectType === 'custom' && params.customModelUrl && (
        <CustomModel 
          url={params.customModelUrl} 
          material={material} 
          onLoaded={setCustomDims} 
        />
      )}
      {params.objectType === 'custom' && !params.customModelUrl && (
          <Text color="white" fontSize={0.5}>请上传模型</Text>
      )}

      {params.showBoundingBox && (
        <BoundingBoxOverlay 
          dims={dims} 
          scale={params.objectScale} 
          color="#fbbf24" 
          showLabels={isGodView} 
        />
      )}
    </group>
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Environment preset="city" />
      
      <Grid 
        position={[0, -2, 0]} 
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#334155" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#64748b" 
        fadeDistance={20} 
      />

      {isGodView && params.isViewLocked ? (
        <TransformControls 
          mode="translate" 
          showX={false} 
          showY={false} 
          showZ={true} 
          onMouseUp={handleDragEnd}
        >
          {ObjectContent}
        </TransformControls>
      ) : (
        ObjectContent
      )}

      <group>
        <group position={[-5, 0, -10]}>
           <Sphere args={[1]} material={new THREE.MeshStandardMaterial({ color: '#ef4444', wireframe: params.wireframe })} />
           {params.showBackgroundBoundingBox && (
              <BoundingBoxOverlay 
                dims={[2, 2, 2]} 
                color="#ef4444" 
                showLabels={isGodView}
                labelScaleMultiplier={1.5}
              />
           )}
        </group>

        <group position={[6, 3, -15]}>
           <Sphere args={[2]} material={new THREE.MeshStandardMaterial({ color: '#10b981', wireframe: params.wireframe })} />
           {params.showBackgroundBoundingBox && (
              <BoundingBoxOverlay 
                dims={[4, 4, 4]} 
                color="#10b981" 
                showLabels={isGodView}
                labelScaleMultiplier={2}
              />
           )}
        </group>

        <group position={[0, -2, -5]}>
           <Box args={[1, 1, 1]} material={new THREE.MeshStandardMaterial({ color: '#fbbf24', wireframe: params.wireframe })} />
           {params.showBackgroundBoundingBox && (
              <BoundingBoxOverlay 
                dims={[1, 1, 1]} 
                color="#fbbf24" 
                showLabels={isGodView}
              />
           )}
        </group>
      </group>
    </>
  );
};

// Optimized Camera Frustum Component
const CameraFrustum = ({ fov, distance, color, opacity = 0.2 }: { fov: number, distance: number, color: string, opacity?: number }) => {
  // Calculate frustum dimensions based on FOV and distance
  // h = tan(fov/2) * dist
  const aspect = 16 / 9; // Assume wide aspect for visualization
  const fovRad = (fov * Math.PI) / 180;
  const halfH = Math.tan(fovRad / 2) * distance;
  const halfW = halfH * aspect;

  const points = useMemo(() => {
    return [
      new THREE.Vector3(0, 0, 0), // Tip
      new THREE.Vector3(-halfW, halfH, -distance), // Top Left
      new THREE.Vector3(halfW, halfH, -distance), // Top Right
      new THREE.Vector3(halfW, -halfH, -distance), // Bottom Right
      new THREE.Vector3(-halfW, -halfH, -distance), // Bottom Left
    ];
  }, [halfH, halfW, distance]);

  // Precise Frustum Geometry matching the rectangular aspect ratio
  const volumeGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // Tip coordinates
    const t = [0, 0, 0];
    // Corner coordinates
    const tl = [-halfW, halfH, -distance];
    const tr = [halfW, halfH, -distance];
    const bl = [-halfW, -halfH, -distance];
    const br = [halfW, -halfH, -distance];

    // Push triangles (Counter-clockwise winding for front facing)
    // Top Face: Tip -> TL -> TR
    vertices.push(...t, ...tl, ...tr);
    // Right Face: Tip -> TR -> BR
    vertices.push(...t, ...tr, ...br);
    // Bottom Face: Tip -> BR -> BL
    vertices.push(...t, ...br, ...bl);
    // Left Face: Tip -> BL -> TL
    vertices.push(...t, ...bl, ...tl);
    
    // Far Cap (Rectangle) - Two triangles
    // TL -> BL -> BR
    vertices.push(...tl, ...bl, ...br);
    // TL -> BR -> TR
    vertices.push(...tl, ...br, ...tr);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, [halfW, halfH, distance]);

  return (
    <group>
      {/* Edges */}
      <Line points={[points[0], points[1]]} color={color} transparent opacity={0.6} />
      <Line points={[points[0], points[2]]} color={color} transparent opacity={0.6} />
      <Line points={[points[0], points[3]]} color={color} transparent opacity={0.6} />
      <Line points={[points[0], points[4]]} color={color} transparent opacity={0.6} />
      
      {/* Far Plane Rect (The "View Plane") */}
      <Line points={[points[1], points[2], points[3], points[4], points[1]]} color={color} transparent opacity={0.9} lineWidth={1.5} />

      {/* Crosshair at center of View Plane */}
      <Line points={[[0, halfH * 0.2, -distance], [0, -halfH * 0.2, -distance]]} color={color} transparent opacity={0.4} />
      <Line points={[[-halfH * 0.2, 0, -distance], [halfH * 0.2, 0, -distance]]} color={color} transparent opacity={0.4} />

      {/* Optical Axis Ray */}
      <Line 
        points={[[0, 0, 0], [0, 0, -distance]]} 
        color={color} 
        lineWidth={1} 
        transparent 
        opacity={0.8} 
        dashed 
        dashScale={5}
      />
      
      {/* View Plane Info Label */}
      <group position={[halfW, -halfH - 0.2, -distance]}>
        <Text 
          color={color} 
          fontSize={0.25} 
          anchorX="right" 
          anchorY="top"
          fillOpacity={0.9}
          outlineWidth={0.02}
          outlineColor="black"
        >
          {`视野平面\n${(halfW * 2).toFixed(1)}m × ${(halfH * 2).toFixed(1)}m`}
        </Text>
      </group>

      {/* Volumetric Beam (Additive Blending for light-like effect) */}
      <mesh geometry={volumeGeometry}>
         <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={opacity} 
            side={THREE.DoubleSide} 
            depthWrite={false}
            blending={THREE.AdditiveBlending}
         />
      </mesh>
    </group>
  );
};

// Component to visualize the physical cameras in God View
const CameraVisualizer = ({ params }: { params: SimulationParams }) => {
  const halfBaseLine = (params.ipd * 0.001) / 2;
  const camZ = params.targetDistance;
  const convergenceAngle = Math.atan(halfBaseLine / params.targetDistance);
  const scale = params.cameraSize;

  const camDims: [number, number, number] = [0.5, 0.5, 1.15];
  const camCenterOffset: [number, number, number] = [0, 0, -0.275];

  // Recalculate FOV here to drive the visualization
  const fov = useMemo(() => {
    const sensorHeight = 24; 
    const fovRadians = 2 * Math.atan(sensorHeight / (2 * params.focalLength));
    return (fovRadians * 180) / Math.PI;
  }, [params.focalLength]);

  // Visual distance for the frustum cone - set to target distance to show convergence plane
  const frustumDist = params.targetDistance;

  const CameraMesh = ({ color, pos, rot, label }: { color: string, pos: [number, number, number], rot: [number, number, number], label: string }) => (
    <group position={pos} rotation={rot}>
      <group scale={[scale, scale, scale]}>
        <Box args={[0.4, 0.3, 0.6]} material={new THREE.MeshStandardMaterial({ color: '#334155' })} />
        <Cone args={[0.25, 0.4, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} material={new THREE.MeshStandardMaterial({ color: '#94a3b8' })} />
        <Sphere args={[0.15]} position={[0, 0, -0.7]} material={new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 })} />
        
        {params.showCameraBoundingBox && (
          <group position={camCenterOffset}>
            <BoundingBoxOverlay 
              dims={camDims} 
              scale={scale}
              color={color} 
              showLabels={true} 
              labelScaleMultiplier={0.8}
            />
          </group>
        )}
      </group>
      
      <Text 
        position={[0, (0.35 * scale), 0]}
        fontSize={0.35 * scale}
        color="white" 
        anchorX="center" 
        anchorY="bottom"
        outlineWidth={0.05 * scale}
        outlineColor={color}
      >
        {label}
      </Text>

      {/* Show FOV Frustum if enabled */}
      {params.showFOV ? (
        <group position={[0, 0, -0.7 * scale]}> {/* Start from lens position approximately */}
           <CameraFrustum fov={fov} distance={frustumDist} color={color} opacity={0.15} />
        </group>
      ) : (
        /* Fallback legacy line */
        <Line 
          points={[[0, 0, 0], [0, 0, -params.targetDistance * 1.2]]} 
          color={color} 
          lineWidth={1} 
          transparent 
          opacity={0.3} 
          dashed 
        />
      )}
    </group>
  );

  return (
    <>
      <CameraMesh 
        color="#22d3ee" 
        pos={[-halfBaseLine, 0, camZ]} 
        rot={[0, -convergenceAngle, 0]} 
        label="左眼(L)"
      />
      <CameraMesh 
        color="#f87171" 
        pos={[halfBaseLine, 0, camZ]} 
        rot={[0, convergenceAngle, 0]} 
        label="右眼(R)"
      />
      
      {/* Target Lines (Keep these as visual guides to the center) */}
      {!params.showFOV && (
        <>
          <Line 
            points={[[-halfBaseLine, 0, camZ], [0, 0, 0]]} 
            color="#22d3ee" 
            lineWidth={2} 
            transparent 
            opacity={0.1} 
          />
          <Line 
            points={[[halfBaseLine, 0, camZ], [0, 0, 0]]} 
            color="#f87171" 
            lineWidth={2} 
            transparent 
            opacity={0.1} 
          />
        </>
      )}
    </>
  );
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ params, viewMode, setParams }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewLeftRef = useRef<HTMLDivElement>(null);
  const viewRightRef = useRef<HTMLDivElement>(null);
  const viewGodRef = useRef<HTMLDivElement>(null);

  const halfBaseLine = (params.ipd * 0.001) / 2;
  const convergenceAngle = Math.atan(halfBaseLine / params.targetDistance);
  const camZ = params.targetDistance;

  const fov = useMemo(() => {
    const sensorHeight = 24; // mm
    const fovRadians = 2 * Math.atan(sensorHeight / (2 * params.focalLength));
    return (fovRadians * 180) / Math.PI;
  }, [params.focalLength]);

  const toggleViewLock = () => {
    setParams(p => ({ ...p, isViewLocked: !p.isViewLocked }));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
      
      {/* Top Section: Stereo Views */}
      <div className="flex-1 relative min-h-0 flex flex-row">
        {/* Left Eye Container */}
        <div ref={viewLeftRef} className={`relative h-full transition-all duration-300 ${viewMode === ViewMode.SIDE_BY_SIDE ? 'w-1/2 border-r border-slate-700' : 'w-full'} ${viewMode === ViewMode.ANAGLYPH || viewMode === ViewMode.OVERLAY ? 'absolute inset-0 mix-blend-screen opacity-100 z-10' : ''}`}>
          <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-cyan-400 border border-cyan-900">
            左眼视图 (L)
          </div>
        </div>

        {/* Right Eye Container */}
        <div ref={viewRightRef} className={`relative h-full transition-all duration-300 ${viewMode === ViewMode.SIDE_BY_SIDE ? 'w-1/2' : 'w-full'} ${viewMode === ViewMode.ANAGLYPH || viewMode === ViewMode.OVERLAY ? 'absolute inset-0 mix-blend-screen opacity-50 z-20 pointer-events-none' : ''}`}>
           <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-red-400 border border-red-900">
            右眼视图 (R)
          </div>
        </div>

        {(viewMode === ViewMode.ANAGLYPH || viewMode === ViewMode.OVERLAY) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-800/80 px-4 py-2 rounded text-sm text-slate-300 pointer-events-none border border-slate-600">
            {viewMode === ViewMode.ANAGLYPH ? "红蓝3D模式: 请佩戴红蓝眼镜" : "叠加对比模式"}
          </div>
        )}
      </div>

      {/* Bottom Section: God View */}
      <div className="h-1/3 border-t border-slate-700 relative bg-slate-900/50 group">
        <div ref={viewGodRef} className="w-full h-full" />
        <div className="absolute top-2 left-2 z-20 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-mono text-amber-400 border border-amber-900/50">
          上帝视角 (GOD VIEW)
        </div>
        
        {/* View Lock Toggle Button */}
        <div className="absolute top-2 right-2 z-20">
          <button 
            onClick={toggleViewLock}
            className={`p-1.5 rounded-md backdrop-blur border transition-all flex items-center gap-2 text-xs font-medium ${
              params.isViewLocked 
                ? "bg-amber-600/30 text-amber-300 border-amber-500/50" 
                : "bg-slate-800/50 text-slate-400 border-slate-600/50 hover:bg-slate-700/50"
            }`}
            title={params.isViewLocked ? "解锁视角以旋转场景" : "锁定视角以拖拽物体"}
          >
            {params.isViewLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {params.isViewLocked ? "已锁定 (拖拽物体)" : "视角自由"}
          </button>
        </div>

        <div className="absolute bottom-2 right-2 z-20 text-[10px] text-slate-500 font-mono pointer-events-none">
           {params.isViewLocked ? "拖拽物体前后移动" : "鼠标左键旋转 · 滚轮缩放"}
        </div>
      </div>
      
      {/* The Single Canvas Logic */}
      <Canvas 
        className="w-full h-full block fixed inset-0 pointer-events-none" 
        eventSource={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        {/* Left View */}
        <View track={viewLeftRef as React.MutableRefObject<HTMLElement>}>
          <color attach="background" args={['#0f172a']} />
          <PerspectiveCamera 
            makeDefault 
            position={[-halfBaseLine, 0, camZ]} 
            fov={fov}
            rotation={[0, -convergenceAngle, 0]}
          />
          <SceneContent params={params} />
           {viewMode === ViewMode.OVERLAY && (
              <mesh position={[0,0,camZ - 1]}>
                 <planeGeometry args={[100,100]} />
                 <meshBasicMaterial color="cyan" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthTest={false} />
              </mesh>
           )}
           {viewMode === ViewMode.ANAGLYPH && (
             <mesh position={[0,0,camZ - 0.5]}>
                <planeGeometry args={[100,100]} />
                <meshBasicMaterial 
                  color="#ff0000" 
                  blending={THREE.MultiplyBlending} 
                  transparent 
                  opacity={1} 
                  depthTest={false} 
                  side={THREE.DoubleSide}
                  premultipliedAlpha={true}
                />
             </mesh>
           )}
        </View>

        {/* Right View */}
        <View track={viewRightRef as React.MutableRefObject<HTMLElement>}>
           <color attach="background" args={['#0f172a']} />
          <PerspectiveCamera 
            makeDefault 
            position={[halfBaseLine, 0, camZ]} 
            fov={fov}
            rotation={[0, convergenceAngle, 0]}
          />
          <SceneContent params={params} />
           {viewMode === ViewMode.OVERLAY && (
              <mesh position={[0,0,camZ - 1]}>
                 <planeGeometry args={[100,100]} />
                 <meshBasicMaterial color="red" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthTest={false} />
              </mesh>
           )}
           {viewMode === ViewMode.ANAGLYPH && (
             <mesh position={[0,0,camZ - 0.5]}>
                <planeGeometry args={[100,100]} />
                <meshBasicMaterial 
                  color="#00ffff" 
                  blending={THREE.MultiplyBlending} 
                  transparent 
                  opacity={1} 
                  depthTest={false} 
                  side={THREE.DoubleSide}
                  premultipliedAlpha={true}
                />
             </mesh>
           )}
        </View>

        {/* God View (Third Person) */}
        <View track={viewGodRef as React.MutableRefObject<HTMLElement>}>
          <color attach="background" args={['#1e293b']} />
          <PerspectiveCamera makeDefault position={[0, 8, params.targetDistance + 5]} fov={50} />
          <OrbitControls 
            makeDefault 
            enabled={!params.isViewLocked}
            minDistance={1} 
            maxDistance={50}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.8}
            zoomSpeed={0.5} 
            panSpeed={0.8}
            enablePan={true}
            maxPolarAngle={Math.PI}
          />
          <SceneContent 
            params={params} 
            isGodView={true} 
            onParamChange={(updates) => setParams((prev) => ({ ...prev, ...updates }))}
          />
          <CameraVisualizer params={params} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
        </View>
      </Canvas>
    </div>
  );
};