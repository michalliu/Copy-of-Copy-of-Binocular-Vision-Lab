import React from 'react';
import { AIAnalysisResult } from '../types';
import { BrainCircuit, BookOpen, Microscope, Sparkles } from 'lucide-react';

interface AIPanelProps {
  result: AIAnalysisResult | null;
  isLoading: boolean;
}

export const AIPanel: React.FC<AIPanelProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center animate-pulse">
        <BrainCircuit className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">正在分析光学几何结构...</p>
        <p className="text-xs mt-2">连接至 Gemini 神经网络</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <Sparkles className="w-12 h-12 mb-4 text-yellow-500/50" />
        <p className="text-slate-300 mb-2 font-medium">暂无分析结果</p>
        <p className="text-sm max-w-xs">调整左侧的参数并点击“分析”，即可获取 Gemini AI 关于视觉物理原理的详细报告。</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          {result.title}
        </h2>
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded px-2 py-0.5 text-[10px] text-indigo-300 uppercase tracking-widest">
          AI 智能分析
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/30">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> 感知原理
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {result.explanation}
          </p>
        </div>

        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/30">
           <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
            <Microscope className="w-4 h-4" /> 深度与分辨率
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {result.depthImplications}
          </p>
        </div>

        <div className="bg-amber-900/10 p-4 rounded-lg border border-amber-700/20">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-2">
            技术说明
          </h3>
          <p className="text-amber-200/80 text-xs font-mono">
            {result.technicalNote}
          </p>
        </div>
      </div>
    </div>
  );
};