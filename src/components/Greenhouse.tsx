import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, RotateCcw, X, Sprout, AlertTriangle, Loader2, Power, RefreshCw } from 'lucide-react';
import { useGreenhouseDetail, useDeviceControl } from '../hooks/useApi';
import { api } from '../api';
import type { Greenhouse as GreenhouseType, ZoneWithDevices, Actuator } from '../api/types';

// --- Types ---
interface ZoneData {
  id: string;
  name: string;
  crop: string;
  status: 'optimal' | 'warning' | 'critical';
  moisture: number; // %
  temp: number; // C
  daysPlanted: number;
  alertMsg?: string;
  position: { x: number, y: number, z: number };
  size: { w: number, d: number };
}

// 默认位置配置（用于3D渲染）
const DEFAULT_POSITIONS = [
  { x: -3.5, y: 0, z: -4 },
  { x: 3.5, y: 0, z: -4 },
  { x: -3.5, y: 0, z: 4 },
  { x: 3.5, y: 0, z: 4 },
];

interface InteractiveObject {
  mesh: THREE.Object3D;
  type: 'zone' | 'actuator';
  id: string;
  data: any;
}

// Helper to project 3D position to 2D screen coordinates for AR labels
const toScreenPosition = (obj: THREE.Object3D, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
  const vector = new THREE.Vector3();
  const widthHalf = 0.5 * renderer.domElement.width;
  const heightHalf = 0.5 * renderer.domElement.height;

  obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);

  vector.x = (vector.x * widthHalf) + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;

  return { 
    x: vector.x / window.devicePixelRatio, 
    y: vector.y / window.devicePixelRatio,
    z: vector.z // Used to check if object is in front of camera
  };
};

export const Greenhouse: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedObj, setSelectedObj] = useState<any | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [arLabels, setArLabels] = useState<{id: string, x: number, y: number, msg: string, type: string}[]>([]);
  
  // API Hooks
  const [greenhouseId, setGreenhouseId] = useState<string>('gh_001');
  const [greenhouses, setGreenhouses] = useState<GreenhouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: greenhouseDetail, loading: detailLoading, refetch } = useGreenhouseDetail(greenhouseId);
  const { controlDevice, loading: controlLoading } = useDeviceControl();

  // 获取大棚列表
  useEffect(() => {
    const fetchGreenhouses = async () => {
      try {
        const data = await api.getGreenhouses();
        setGreenhouses(data);
        if (data.length > 0) {
          setGreenhouseId(data[0].id);
        }
      } catch (e) {
        console.error('获取大棚列表失败:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchGreenhouses();
  }, []);

  // 处理设备控制
  const handleDeviceControl = async (device: Actuator, action: 'IRRIGATION' | 'VENTILATION' | 'LIGHTING' | 'HEATING') => {
    try {
      await controlDevice(device.id, { action, duration: 300, mode: 'MANUAL' });
      alert(`指令已发送: ${device.name} - ${action}`);
      refetch();
    } catch (e) {
      console.warn('设备控制失败');
    }
  };

  // 使用 API 数据（无 fallback）
  const zonesData = (greenhouseDetail?.zones && greenhouseDetail.zones.length > 0) 
    ? greenhouseDetail.zones.map((zwd, idx) => {
        const statusMap: Record<string, 'optimal' | 'warning' | 'critical'> = {
          HEALTHY: 'optimal',
          WARNING: 'warning',
          CRITICAL: 'critical'
        };
        return {
          id: zwd.zone.id,
          name: zwd.zone.name,
          crop: zwd.zone.cropType || '未知作物',
          status: statusMap[zwd.zone.status || 'HEALTHY'] || 'optimal',
          moisture: 60 + Math.random() * 20,
          temp: 22 + Math.random() * 6,
          daysPlanted: Math.floor(Math.random() * 60),
          alertMsg: zwd.zone.status === 'WARNING' ? '需要关注' : zwd.zone.status === 'CRITICAL' ? '异常警报' : undefined,
          position: DEFAULT_POSITIONS[idx % 4],
          size: { w: 3, d: 6 },
          devices: zwd.devices
        };
      })
    : [];
  
  // Simulation State
  const [fanOn, setFanOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);

  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const angleRef = useRef({ x: 0.5, y: 0.6 }); 
  const interactiveObjects = useRef<InteractiveObject[]>([]);
  const warningNodesRef = useRef<THREE.Object3D[]>([]); // Track objects that need labels

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Scene Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.FogExp2('#0f172a', 0.035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    
    const updateCameraPosition = () => {
      const radius = 22;
      camera.position.x = radius * Math.sin(angleRef.current.x) * Math.cos(angleRef.current.y);
      camera.position.z = radius * Math.cos(angleRef.current.x) * Math.cos(angleRef.current.y);
      camera.position.y = radius * Math.sin(angleRef.current.y);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404040, 2); 
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // --- Environment ---
    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    scene.add(floor);

    // Glass House Structure
    const glassGeo = new THREE.BoxGeometry(14, 8, 20);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8, transmission: 0.2, opacity: 0.1, transparent: true, roughness: 0.1, side: THREE.DoubleSide
    });
    const structure = new THREE.Mesh(glassGeo, glassMat);
    structure.position.y = 4;
    scene.add(structure);

    // Frame
    const edges = new THREE.EdgesGeometry(glassGeo);
    const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x334155 }));
    frame.position.y = 4;
    scene.add(frame);

    // --- Create Zones (Blocks) ---
    const boxGeo = new THREE.BoxGeometry(1, 1, 1); // Base geometry to be scaled
    
    // 如果没有数据，显示空场景
    if (zonesData.length === 0) {
      // 添加提示文字
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无大棚数据', 256, 70);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(8, 2, 1);
      sprite.position.set(0, 4, 0);
      scene.add(sprite);
    }
    
    zonesData.forEach(zone => {
      const zoneGroup = new THREE.Group();
      zoneGroup.position.set(zone.position.x, 0.5, zone.position.z);

      // 1. The Planter Box
      const planterMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const planter = new THREE.Mesh(boxGeo, planterMat);
      planter.scale.set(zone.size.w, 1, zone.size.d);
      planter.castShadow = true;
      zoneGroup.add(planter);

      // 2. The Soil
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3f2e26, roughness: 1 });
      const soil = new THREE.Mesh(boxGeo, soilMat);
      soil.scale.set(zone.size.w - 0.2, 0.1, zone.size.d - 0.2);
      soil.position.y = 0.5;
      zoneGroup.add(soil);

      // 3. Crops (Visual Representation)
      const cropCount = 8;
      const cropMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
      for(let i=0; i<cropCount; i++) {
        const plant = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 8), cropMat);
        // Distribute loosely
        plant.position.set(
          (Math.random() - 0.5) * (zone.size.w - 0.5),
          0.8,
          (Math.random() - 0.5) * (zone.size.d - 0.5)
        );
        zoneGroup.add(plant);
      }

      // 4. Status Indicator (LED Strip at base)
      let statusColor = 0x22c55e; // Optimal
      if (zone.status === 'warning') statusColor = 0xf59e0b;
      if (zone.status === 'critical') statusColor = 0xef4444;

      const ledGeo = new THREE.BoxGeometry(zone.size.w + 0.1, 0.1, zone.size.d + 0.1);
      const ledMat = new THREE.MeshBasicMaterial({ color: statusColor, transparent: true, opacity: 0.6 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = -0.4;
      zoneGroup.add(led);

      // 5. Add "Target" for AR Label
      if (zone.status !== 'optimal') {
        const target = new THREE.Object3D();
        target.position.set(0, 2, 0); // Float above the zone
        target.userData = { msg: zone.alertMsg, id: zone.id, type: zone.status };
        zoneGroup.add(target);
        warningNodesRef.current.push(target); // Track for projection
        
        // Add a pulsing visual indicator in 3D too
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.3),
          new THREE.MeshBasicMaterial({ color: statusColor, wireframe: true })
        );
        sphere.position.set(0, 2, 0);
        zoneGroup.add(sphere);
        
        // Simple pulse animation handled in loop
        sphere.userData = { isPulse: true };
      }

      scene.add(zoneGroup);

      // Register for interaction
      interactiveObjects.current.push({
        mesh: planter, // Hitbox
        type: 'zone',
        id: zone.id,
        data: zone
      });
      // Register children (plants/soil) to bubble up to this zone
      interactiveObjects.current.push({ mesh: soil, type: 'zone', id: zone.id, data: zone });
    });

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsAutoRotating(false);
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => isDragging = false;
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        angleRef.current.x -= dx * 0.005;
        angleRef.current.y += dy * 0.005;
        angleRef.current.y = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, angleRef.current.y));
        updateCameraPosition();
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };
    const onClick = (e: MouseEvent) => {
      if (isDragging) return;
      const rect = mountRef.current!.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        // Traverse up to find registered object
        while(obj) {
          const found = interactiveObjects.current.find(i => i.mesh === obj);
          if (found) {
            setSelectedObj(found.data);
            return;
          }
          obj = obj.parent!;
        }
      }
      setSelectedObj(null);
    };

    mountRef.current.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    mountRef.current.addEventListener('mousemove', onMouseMove);
    mountRef.current.addEventListener('click', onClick);

    // --- Animation Loop ---
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (isAutoRotating) {
        angleRef.current.x += 0.002;
        updateCameraPosition();
      }

      // Update AR Labels
      const labels = warningNodesRef.current.map(node => {
        const screenPos = toScreenPosition(node, camera, renderer);
        // Only show if in front of camera and within bounds roughly
        if (screenPos.z < 1 && screenPos.x > 0 && screenPos.x < width && screenPos.y > 0 && screenPos.y < height) {
          return {
            id: node.userData.id,
            msg: node.userData.msg,
            type: node.userData.type,
            x: screenPos.x,
            y: screenPos.y
          };
        }
        return null;
      }).filter(Boolean) as any[];
      setArLabels(labels);

      // Pulse Animations
      scene.children.forEach(child => {
        if(child.type === 'Group') {
          child.children.forEach(sub => {
            if(sub.userData.isPulse) {
              sub.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.2);
              sub.rotation.y += 0.02;
            }
          })
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousedown', onMouseDown);
        mountRef.current.removeEventListener('mousemove', onMouseMove);
        mountRef.current.removeEventListener('click', onClick);
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [isAutoRotating, zonesData]);

  return (
    <div className="bg-slate-900 h-full flex flex-col relative overflow-hidden select-none">
      {/* 3D Container */}
      <div ref={mountRef} className="w-full h-full cursor-move" />

      {/* AR Floating Labels Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {arLabels.map((label, idx) => (
          <div 
            key={`${label.id}-${idx}`}
            style={{ 
              left: label.x, 
              top: label.y, 
              transform: 'translate(-50%, -100%)' 
            }}
            className="absolute pointer-events-auto cursor-pointer animate-bounce-slow"
            onClick={() => {
              const zone = zonesData.find(z => z.id === label.id);
              if(zone) setSelectedObj(zone);
            }}
          >
            <div className={`flex flex-col items-center`}>
              <div className={`px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold text-white flex items-center gap-1 mb-2 border ${
                label.type === 'critical' ? 'bg-red-500/90 border-red-400' : 'bg-orange-500/90 border-orange-400'
              }`}>
                <AlertTriangle className="w-3 h-3" />
                {label.msg}
              </div>
              <div className={`w-3 h-3 rotate-45 border-r border-b -mt-3.5 z-0 ${
                label.type === 'critical' ? 'bg-red-500 border-red-400' : 'bg-orange-500 border-orange-400'
              }`}></div>
              <div className={`w-0.5 h-8 ${label.type === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Header Controls */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
          <Activity className="text-green-500" /> 智能地块监控
        </h2>
        <p className="text-slate-300 mt-1 text-sm drop-shadow-md">
          点击地块或警告图标查看详情
        </p>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => setIsAutoRotating(!isAutoRotating)} 
          className={`p-2 rounded-lg transition-colors border shadow-lg ${isAutoRotating ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          title="自动巡检"
        >
          <RotateCcw className={`w-5 h-5 ${isAutoRotating ? 'animate-spin-slow' : ''}`} />
        </button>
      </div>

      {/* Detail Slide-out Panel */}
      <div className={`absolute top-0 bottom-0 right-0 w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out z-20 ${selectedObj ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedObj && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${
                  selectedObj.status === 'optimal' ? 'bg-green-500/20 text-green-400' :
                  selectedObj.status === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedObj.status === 'optimal' ? '生长良好' : selectedObj.status === 'warning' ? '需要注意' : '严重警告'}
                </span>
                <h3 className="text-xl font-bold text-white">{selectedObj.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{selectedObj.crop}</p>
              </div>
              <button onClick={() => setSelectedObj(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {selectedObj.alertMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-bold text-sm">系统警报</h4>
                    <p className="text-red-200 text-sm mt-1">{selectedObj.alertMsg}</p>
                    <button className="mt-3 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors">
                      启动应急处理
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">土壤水分</div>
                  <div className="text-2xl font-bold text-blue-400">{selectedObj.moisture}%</div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${selectedObj.moisture}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">区域温度</div>
                  <div className="text-2xl font-bold text-orange-400">{selectedObj.temp}°C</div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${(selectedObj.temp / 40) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-green-500" /> 生长进度
                  </h4>
                </div>
                <div className="p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">已种植 {selectedObj.daysPlanted} 天</span>
                    <span className="text-white">预计 20 天后采收</span>
                  </div>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 bg-green-500" style={{ width: '65%' }}></div>
                    {/* Markers */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900 left-[33%]"></div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-900 left-[66%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>幼苗期</span>
                    <span>生长期</span>
                    <span>结果期</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">AI 种植建议</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-sm text-slate-300">
                    <span className="text-green-500">•</span>
                    {selectedObj.moisture < 40 ? '建议立即启动滴灌系统，补充水分。' : '当前水分适宜，保持通风。'}
                  </li>
                  <li className="flex gap-2 text-sm text-slate-300">
                    <span className="text-green-500">•</span>
                    预计明日光照强烈，建议开启遮阳网。
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-indigo-900/20">
                查看历史数据图表
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};