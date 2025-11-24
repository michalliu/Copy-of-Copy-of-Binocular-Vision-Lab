import React, { useState, useEffect } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Controls } from './components/Controls';
import { AIPanel } from './components/AIPanel';
import { SimulationParams, ViewMode, AIAnalysisResult } from './types';
import { DEFAULT_PARAMS } from './constants';
import { analyzeSimulation } from './services/geminiService';
import { Glasses, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SIDE_BY_SIDE);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate vergence on param change
  useEffect(() => {
    // Basic trigonometry for convergence angle (half angle)
    // tan(theta) = (ipd/2) / distance
    // We convert ipd from mm to m
    const halfBaseM = (params.ipd / 1000) / 2;
    const angleRad = Math.atan(halfBaseM / params.targetDistance);
    const angleDeg = angleRad * (180 / Math.PI);
    
    setParams(p => ({
      ...p,
      vergenceAngle: angleDeg * 2 // Total vergence
    }));
  }, [params.ipd, params.targetDistance]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeSimulation(params);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || "分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col text-slate-200">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Glasses className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            双目视觉<span className="text-indigo-400">模拟实验室</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>系统运行中</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded border border-slate-700">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>辐辏角: {params.vergenceAngle.toFixed(2)}°</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="w-full h-full grid grid-cols-12 gap-4">
          
          {/* Left Panel: Controls (2 cols) */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-2 h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
            <Controls 
              params={params} 
              setParams={setParams} 
              viewMode={viewMode}
              setViewMode={setViewMode}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Center: 3D Simulation (7 cols) */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7 h-full flex flex-col">
            <SimulationCanvas params={params} viewMode={viewMode} setParams={setParams} />
            
            {/* Legend / Status Bar underneath canvas */}
            <div className="mt-3 flex justify-between items-center text-xs text-slate-500 px-2">
              <div>
                 左眼位: <span className="text-cyan-400">{-params.ipd/2}mm</span> | 右眼位: <span className="text-red-400">+{params.ipd/2}mm</span>
              </div>
              <div>
                目标距离: {params.targetDistance}m
              </div>
            </div>
          </div>

          {/* Right Panel: AI Analysis (3 cols) */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3 h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl relative">
            {error ? (
              <div className="p-6 text-red-400 text-sm text-center">
                <p className="mb-2 font-bold">错误</p>
                {error}
                <button 
                  onClick={() => setError(null)} 
                  className="mt-4 text-xs underline opacity-70 hover:opacity-100"
                >
                  忽略
                </button>
              </div>
            ) : (
              <AIPanel result={analysis} isLoading={isAnalyzing} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;