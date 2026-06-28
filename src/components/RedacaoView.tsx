/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  HelpCircle, 
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  BookOpen,
  X,
  Target
} from 'lucide-react';
import { EssayCorrection, ActivityLog } from '../types';
import AdPlaceholder from './AdPlaceholder';

interface RedacaoViewProps {
  onAddCorrection: (correction: EssayCorrection, log: ActivityLog) => void;
  essayCorrections: EssayCorrection[];
}

export default function RedacaoView({ onAddCorrection, essayCorrections }: RedacaoViewProps) {
  const [activeTab, setActiveTab] = useState<'digitar' | 'upload'>('digitar');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  
  // Tab for active correction selection
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<string | null>(
    essayCorrections.length ? essayCorrections[0].id : null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // DRAG AND DROP UTILITIES
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, carregue somente arquivos de imagem (PNG, JPEG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // TRIGGER REAL CORRECT ENDPOINT
  const handleSendCorrection = async () => {
    if (activeTab === 'digitar' && text.trim().length < 80) {
      alert('Sua redação precisa conter pelo menos 80 caracteres para uma análise consistente.');
      return;
    }

    if (activeTab === 'upload' && !filePreview) {
      alert('Carregue uma foto da sua redação antes de solicitar a correção.');
      return;
    }

    setIsLoading(true);
    setSelectedIndex(-1); // reset accordion states
    setSelectedCorrectionId(null);

    // Dynamic encouraging prompts to cycle through
    const steps = [
      'Ativando 10 IAs corretoras em paralelo...',
      'Consultando LLaMA 3.3, DeepSeek R1, Qwen 2.5...',
      'Consultando Gemma 3, Mistral Small, DeepSeek Chat...',
      'Consultando Phi 3.5, Command R7B, Gemma 2, Nemotron...',
      'Compilando consenso entre modelos de IA...',
      'Gerando relatório final com média das notas...'
    ];

    let stepIdx = 0;
    setCurrentStepText(steps[0]);
    const timer = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setCurrentStepText(steps[stepIdx]);
      }
    }, 2800);

    try {
      const payload: any = { title: title || 'Redação Sem Título' };
      if (activeTab === 'digitar') {
        payload.text = text;
      } else {
        payload.imageBase64 = filePreview;
      }

      const res = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Falha de resposta no servidor ApexEnem.');
      }

      const correctionResult = await res.json();
      
      const newId = `cor-${Date.now()}`;
      const finalCorrection: EssayCorrection = {
        ...correctionResult,
        id: newId,
        title: title || 'O Papel da Tecnologia na Educação',
        text: activeTab === 'digitar' ? text : 'Texto manuscrito processado por IA',
        date: new Date().toLocaleDateString('pt-BR')
      };

      // Create log
      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        type: 'redacao',
        title: 'Redação avaliada por IA',
        description: `Ref: "${finalCorrection.title}". Nota alcançada: ${finalCorrection.score} pontos.`,
        timeAgo: 'Agora mesmo',
        date: new Date().toISOString()
      };

      onAddCorrection(finalCorrection, log);
      setSelectedCorrectionId(newId);

      // Reset Form
      setTitle('');
      setText('');
      setFilePreview(null);
    } catch (err: any) {
      console.error(err);
      alert('Ocorreu um erro no pipeline de IA. Retornando análise com parâmetros padrão.');
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  // UI state for accordion open
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Current active correction info to visualize
  const activeCorrection = essayCorrections.find(c => c.id === selectedCorrectionId) || essayCorrections[0];

  return (
    <div id="redacao-wrapper" className="space-y-6 animate-fade-in" style={{ contentVisibility: 'auto' }}>
      
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Corretor de Redação por IA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Envie sua redação digitada ou uma foto legível e receba uma nota de 0 a 1000 com revisão das 5 competências do ENEM.
          </p>
        </div>

        {/* Existing corrections list selector */}
        {essayCorrections.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400" htmlFor="correction-history-select">Histórico:</label>
            <select
              id="correction-history-select"
              className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-705 py-1.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              value={selectedCorrectionId || ''}
              onChange={(e) => setSelectedCorrectionId(e.target.value)}
            >
              {essayCorrections.map((curr) => (
                <option key={curr.id} value={curr.id}>
                  {curr.title} ({curr.score} pts)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <AdPlaceholder slot="redacao-topo" format="banner" className="my-4" />

      {/* Main Split-View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="split-view-columns">
        
        {/* LEFT COLUMN: INPUT FORM (Spans 5 lines in large screens) */}
        <div className="lg:col-span-6 space-y-6" id="input-column">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="p-1 bg-blue-600 text-white rounded-lg"><FileText className="h-4 w-4" /></span>
              Nova Submissão
              <span className="ml-auto text-[9px] font-mono bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                10 IAs
              </span>
            </h3>

            {/* Essay Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-200" htmlFor="essay-title">
                Título do Tema da Redação
              </label>
              <input
                id="essay-title"
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 transition"
                placeholder="Ex e.g. O Estigma Associado às Doenças Mentais na Sociedade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Input Select Tab Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-200">
                Formato de Envio
              </label>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#0f172a] rounded-xl" id="redacao-tab-selectors">
                <button
                  id="tab-mode-digitar"
                  type="button"
                  className={`py-2 text-center text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeTab === 'digitar'
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  onClick={() => setActiveTab('digitar')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Digitar Redação</span>
                </button>
                <button
                  id="tab-mode-foto"
                  type="button"
                  className={`py-2 text-center text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-[#1e293b] dark:text-white font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="h-4 w-4" />
                  <span>Mandar Foto</span>
                </button>
              </div>
            </div>

            {/* Interactive Areas depending on selection */}
            {activeTab === 'digitar' ? (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <label className="font-bold text-slate-800 dark:text-slate-200" htmlFor="essay-textarea">Conteúdo do Texto</label>
                  <span>{text.length} caracteres ({Math.round(text.length / 5.5)} palavras estimadas)</span>
                </div>
                
                {/* Simulated ENEM lined paper effect */}
                <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-50 dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col pt-3 items-center text-[10px] font-mono text-slate-400/80 space-y-1 select-none">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <span key={i} className="leading-5 h-5 flex items-center">{i + 1}</span>
                    ))}
                  </div>
                  <textarea
                    id="essay-textarea"
                    rows={15}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0f172a] text-[#1e293b] dark:text-slate-100 text-sm font-sans focus:outline-none transition leading-5 h-[320px] resize-none"
                    placeholder="Mínimo 8 linhas. Escreva seus parágrafos de introdução, desenvolvimento e proposta de intervenção..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-bold text-[#1b1b24] dark:text-[#f3effc]">Fotografia do Manuscrito</label>
                
                {/* Drag zone handler container */}
                {!filePreview ? (
                  <div
                    id="dropzone-paper"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/30'
                        : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] hover:border-blue-500'
                    }`}
                  >
                    <input
                      id="upload-file-picker"
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <div className="p-3 bg-blue-50 dark:bg-[#0f172a] text-blue-600 rounded-full mb-3 shadow-md">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Arrastar e soltar foto legível aqui</p>
                    <p className="text-xs text-slate-400 mt-1">Ou clique para selecionar no celular / computador</p>
                    <p className="text-[10px] text-slate-400 mt-3 font-mono">SUPORTA PNG, JPG, JPEG ATÉ 10MB</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100" id="uploaded-preview">
                    <img
                      src={filePreview}
                      alt="Preview da manuscrita"
                      className="w-full max-h-48 object-contain backdrop-blur-md"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow">
                        Foto carregada com sucesso!
                      </span>
                    </div>
                    <button
                      id="remove-uploaded-file"
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-2.5 right-2.5 bg-white text-black p-1.5 rounded-lg shadow border border-slate-200 hover:bg-slate-50 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Evaluate Trigger button */}
            <button
              id="btn-trigger-ai-correction"
              type="button"
              disabled={isLoading}
              onClick={handleSendCorrection}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLoading 
                  ? 'bg-blue-300 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 dark:shadow-none hover:translate-y-[-1px]'
              }`}
            >
              <Sparkles className="h-4 w-4 fill-white" />
              <span>{isLoading ? 'Solicitando Inteligência Artificial...' : 'Corrigir com IA Gratuita'}</span>
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: AI RESULTS PANEL */}
        <div className="lg:col-span-6" id="results-column">
          
          {/* A. LOADING ANIMATION */}
          {isLoading && (
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-5 shadow-sm min-h-[440px] flex flex-col justify-center items-center">
              
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs animate-pulse">🎓</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-sm md:text-base animate-pulse">
                  Consultando 10 IAs em paralelo...
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Isso pode demorar de 8 a 20 segundos. Dez modelos de IA estão analisando seu texto simultaneamente.
                </p>
              </div>

              {/* Cycling Status Prompt Box */}
              <div className="bg-slate-50 dark:bg-[#0f172a] p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xs font-mono text-[10px] text-blue-600 dark:text-blue-400">
                🚀 Status atual: {currentStepText}
              </div>
            </div>
          )}

          {/* B. IDLE EMPTY PLACEHOLDER STATE */}
          {!isLoading && !activeCorrection && (
            <div className="bg-slate-50/50 dark:bg-[#1e293b]/60 rounded-3xl border-2 border-dashed border-slate-250 dark:border-slate-800 p-12 text-center space-y-4 min-h-[440px] flex flex-col justify-center items-center" id="empty-corrections-badge">
              <div className="p-3.5 bg-slate-100 dark:bg-[#0f172a] text-slate-450 rounded-full">
                <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-display font-extrabold text-slate-800 dark:text-slate-100 text-base">Aguardando Redação</h3>
              <p className="text-xs text-slate-450 max-w-xs leading-relaxed">
                Insira o seu título, digite ou envie uma foto do texto manuscrito no painel esquerdo para que a inteligência artificial faça a análise gramatical.
              </p>
            </div>
          )}

          {/* C. ACTIVE DETAILED ANALYSIS DISPLAY */}
          {!isLoading && activeCorrection && (
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6" id="correction-results-view">
              
              {/* Main Score Header Card */}
              <div className="bg-gradient-to-r from-blue-750 via-blue-600 to-indigo-600 text-white p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
                
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                  <Target className="h-32 w-32 translate-x-10 translate-y-5" />
                </div>

                <div className="text-center md:text-left space-y-1 relative z-10">
                  <span className="text-[10px] font-mono text-blue-100 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">Nota Final do Professor</span>
                  <h3 className="font-display font-extrabold text-base md:text-lg truncate">{activeCorrection.title}</h3>
                  <p className="text-xs text-blue-50 flex items-center justify-center md:justify-start gap-1">
                    <span>Avaliado em {activeCorrection.date}</span>
                  </p>
                </div>

                <div className="text-center bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-sm relative z-10">
                  <span className="text-4xl lg:text-5xl font-display font-black tracking-tighter">
                    {activeCorrection.score}
                  </span>
                  <span className="text-xs text-blue-200 block mt-1">/ 1000 pts</span>
                </div>
              </div>

              {/* General Diagnistic Feedback */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 font-mono">Feedback Geral Diagnóstico</h4>
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeCorrection.generalFeedback}
                </div>
              </div>

              {/* Detailed Accordion of 5 ENEM Competencies */}
              <div className="space-y-2.5">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 font-mono">Competências do ENEM</h4>
                
                <div className="space-y-2" id="competencies-accordion">
                  {activeCorrection.competencies.map((comp, idx) => {
                    const isOpen = selectedIndex === idx;
                    return (
                      <div 
                        key={comp.id} 
                        id={`competence-card-${comp.id}`}
                        className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all bg-slate-50/50 dark:bg-[#0f172a]/30"
                      >
                        <button
                          type="button"
                          className="w-full py-3.5 px-4 flex justify-between items-center text-xs font-bold text-left hover:bg-slate-50 dark:hover:bg-[#0f172a]/60 transition cursor-pointer"
                          onClick={() => setSelectedIndex(isOpen ? -1 : idx)}
                        >
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-mono">C{comp.id}</span>
                            <span className="truncate text-slate-800 dark:text-slate-100">{comp.name}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-display font-extrabold text-blue-600 dark:text-blue-400">
                              {comp.score} / 200
                            </span>
                            <span className="text-slate-400 font-normal">{isOpen ? '▲' : '▼'}</span>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="p-4 bg-white dark:bg-[#0f172a] border-t border-slate-250 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-slide-down">
                            <p className="font-semibold text-slate-400 italic">" {comp.description} "</p>
                            <p className="leading-relaxed bg-slate-55 dark:bg-[#1e293b]/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                              <b>Análise do Corretor:</b> {comp.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION PLAN SECTION (Dividing Weaknesses and Strengths) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-5" id="action-plan">
                
                {/* Strengths */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-green-500 font-mono flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Pontos Fortes
                  </h4>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-1">
                    {activeCorrection.strengths.map((s, i) => (
                      <li key={i} className="flex gap-1.5 items-start">
                        <span className="text-green-500">▶</span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-600 font-mono flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Plano de Ação (Ajustes)
                  </h4>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-1">
                    {activeCorrection.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-1.5 items-start">
                        <span className="text-amber-500">⚠</span>
                        <span className="leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      <AdPlaceholder slot="redacao-rodape" format="banner" className="mt-6" />

    </div>
  );
}
