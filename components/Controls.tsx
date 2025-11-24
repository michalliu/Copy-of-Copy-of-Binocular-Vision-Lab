import React, { useRef } from 'react';
import { SimulationParams, ViewMode } from '../types';
import { MIN_IPD, MAX_IPD, MIN_DISTANCE, MAX_DISTANCE } from '../constants';
import { Sliders, Eye, Box, Move3d, Grid3X3, Play, Pause, Square, Camera, Image, Info, Upload, Cone } from 'lucide-react';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const Slider = ({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  unit, 
  onChange,
  tooltipTitle,
  tooltipContent
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  step: number; 
  unit: string; 
  onChange: (val: number) => void; 
  tooltipTitle?: string;
  tooltipContent?: string;
}) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm text-slate-400 mb-1 items-center">
      <div className="flex items-center gap-1.5 group relative">
        <label>{label}</label>
        {tooltipTitle && (
          <>
             <Info className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
             {/* Tooltip Popup */}
             <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               <h4 className="text-xs font-bold text-indigo-300 mb-1">{tooltipTitle}</h4>
               <p className="text-[10px] text-slate-300 leading-relaxed">{tooltipContent}</p>
             </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
          }}
          className="w-16 bg-slate-800 text-right text-xs font-mono text-slate-200 border border-slate-700 rounded px-1 focus:outline-none focus:border-indigo-500"
        />
        <span className="font-mono text-slate-500 text-xs w-6">{unit}</span>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    />
  </div>
);

export const Controls: React.FC<ControlsProps> = ({ 
  params, 
  setParams, 
  viewMode, 
  setViewMode, 
  onAnalyze, 
  isAnalyzing 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updateParam = (key: keyof SimulationParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Clean up previous URL if needed (in a real app), here we just overwrite
      updateParam('customModelUrl', url);
      updateParam('objectType', 'custom');
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-slate-800/50 overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 text-indigo-400">
        <Sliders className="w-5 h-5" />
        <h2 className="text-lg font-semibold tracking-wide uppercase">参数控制</h2>
      </div>

      <div className="space-y-6">
        {/* Optical Parameters */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" /> 光学参数
          </h3>
          
          <Slider
            label="瞳距 (IPD)"
            value={params.ipd}
            min={MIN_IPD}
            max={MAX_IPD}
            step={0.5}
            unit="mm"
            onChange={(v) => updateParam('ipd', v)}
            tooltipTitle="瞳距 (Interpupillary Distance)"
            tooltipContent="两个瞳孔中心之间的距离。瞳距越大，双眼看到的图像差异（视差）越大，立体感通常越强，但也可能导致视觉疲劳。一般成人的瞳距约为 58-70mm。"
          />
          
          <Slider
            label="物体距离"
            value={params.targetDistance}
            min={MIN_DISTANCE}
            max={MAX_DISTANCE}
            step={0.1}
            unit="m"
            onChange={(v) => updateParam('targetDistance', v)}
            tooltipTitle="物体距离 (Target Distance)"
            tooltipContent="观察者眼睛到目标物体的直线距离。距离越近，为了对焦物体，双眼需要的辐辏角（内聚角度）就越大，产生的视差也越明显。"
          />

          <Slider
            label="相机焦距 / FOV"
            value={params.focalLength}
            min={15}
            max={200}
            step={1}
            unit="mm"
            onChange={(v) => updateParam('focalLength', v)}
            tooltipTitle="焦距与视场角 (Focal Length & FOV)"
            tooltipContent="调节焦距会直接改变视场角 (FOV)。焦距越小（广角），FOV 越大，能看到的范围越广；焦距越大（长焦），FOV 越小，视野越窄。开启‘显示视场’可在上帝视角中观察变化。"
          />
        </div>

        {/* Scene Objects */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
           <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" /> 目标物体
          </h3>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { id: 'torus', label: '环面' },
              { id: 'cube', label: '立方体' },
              { id: 'sphere', label: '球体' },
              { id: 'dna', label: 'DNA' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => updateParam('objectType', item.id)}
                className={`p-2 rounded text-[10px] font-medium transition-colors ${
                  params.objectType === item.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Upload Custom Model */}
          <div className="mb-4">
             <input 
               type="file" 
               accept=".glb,.gltf" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleFileUpload}
             />
             <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all border ${
                  params.objectType === 'custom'
                    ? 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50'
                    : 'bg-slate-700 text-slate-300 border-transparent hover:bg-slate-600'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {params.objectType === 'custom' && params.customModelUrl ? "切换自定义模型" : "上传模型 (.glb/.gltf)"}
              </button>
          </div>

          <div className="flex gap-2">
             <button
              onClick={() => updateParam('isPaused', !params.isPaused)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                !params.isPaused 
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 hover:bg-emerald-600/30' 
                  : 'bg-amber-600/20 text-amber-400 border border-amber-600/50 hover:bg-amber-600/30'
              }`}
            >
              {params.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {params.isPaused ? "播放" : "暂停"}
            </button>
            
            <button
              onClick={() => updateParam('wireframe', !params.wireframe)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                params.wireframe 
                  ? 'bg-indigo-600 text-white border border-indigo-500' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-transparent'
              }`}
            >
              <Grid3X3 className="w-3 h-3" />
              网格模式
            </button>
          </div>
          
           <div className="mt-4 flex gap-2">
             <button
              onClick={() => updateParam('showBoundingBox', !params.showBoundingBox)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                params.showBoundingBox 
                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-transparent'
              }`}
            >
              <Square className="w-3 h-3" />
              显示包围盒
            </button>
          </div>

          <div className="mt-4 border-t border-slate-700/50 pt-4">
            <Slider
              label="物体缩放"
              value={params.objectScale}
              min={0.1}
              max={2.0}
              step={0.1}
              unit="x"
              onChange={(v) => updateParam('objectScale', v)}
            />
          </div>
        </div>

        {/* Environment Reference */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
           <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-pink-400" /> 环境参考
          </h3>
          <div className="flex gap-2">
             <button
              onClick={() => updateParam('showBackgroundBoundingBox', !params.showBackgroundBoundingBox)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                params.showBackgroundBoundingBox 
                  ? 'bg-pink-600/20 text-pink-400 border border-pink-600/50' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-transparent'
              }`}
            >
              <Square className="w-3 h-3" />
              背景包围盒
            </button>
          </div>
        </div>

        {/* Visual Settings */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
           <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" /> 显示设置
          </h3>
          <Slider
            label="相机模型大小"
            value={params.cameraSize}
            min={0.1}
            max={1.0}
            step={0.05}
            unit="x"
            onChange={(v) => updateParam('cameraSize', v)}
          />
           <div className="flex gap-2 mt-2">
             <button
              onClick={() => updateParam('showCameraBoundingBox', !params.showCameraBoundingBox)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                params.showCameraBoundingBox 
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-transparent'
              }`}
            >
              <Square className="w-3 h-3" />
              相机包围盒
            </button>
            <button
              onClick={() => updateParam('showFOV', !params.showFOV)}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                params.showFOV
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-transparent'
              }`}
            >
              <Cone className="w-3 h-3" />
              显示视场 (FOV)
            </button>
          </div>
        </div>

        {/* View Mode */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
           <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Move3d className="w-4 h-4 text-amber-400" /> 视图模式
          </h3>
          <div className="flex bg-slate-800 rounded p-1">
            <button
              onClick={() => setViewMode(ViewMode.SIDE_BY_SIDE)}
              className={`flex-1 py-1.5 text-xs rounded transition-all ${viewMode === ViewMode.SIDE_BY_SIDE ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              左右分屏
            </button>
             <button
              onClick={() => setViewMode(ViewMode.ANAGLYPH)}
              className={`flex-1 py-1.5 text-xs rounded transition-all ${viewMode === ViewMode.ANAGLYPH ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              红蓝3D
            </button>
            <button
              onClick={() => setViewMode(ViewMode.OVERLAY)}
              className={`flex-1 py-1.5 text-xs rounded transition-all ${viewMode === ViewMode.OVERLAY ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              叠加对比
            </button>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
        >
          {isAnalyzing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <span className="group-hover:scale-105 transition-transform">Gemini AI 分析</span>
          )}
        </button>
      </div>
    </div>
  );
};