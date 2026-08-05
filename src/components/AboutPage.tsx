import React from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap, Sparkles, ArrowRight, BookOpen, Brain, BarChart3,
  PenLine, Shield, Rocket, Target, Eye, Heart, LineChart, Users,
  Lightbulb, Scale, Zap, Smartphone, Mic, Cpu, Layers,
} from 'lucide-react';

export default function AboutPage({
  onStart,
  onSignup,
  onBack,
}: {
  onStart: () => void;
  onSignup?: () => void;
  onBack?: () => void;
}) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const values = [
    { icon: BookOpen, title: 'Educação', desc: 'A tecnologia deve aproximar pessoas do conhecimento, nunca afastar.', color: 'from-blue-500 to-blue-600' },
    { icon: Lightbulb, title: 'Inovação', desc: 'Estamos sempre em busca de novas soluções para melhorar o aprendizado.', color: 'from-purple-500 to-purple-600' },
    { icon: Scale, title: 'Transparência', desc: 'IA responsável, explicações claras e honestidade sobre como tudo funciona.', color: 'from-emerald-500 to-emerald-600' },
    { icon: Heart, title: 'Acessibilidade', desc: 'Educação de qualidade para todos, sem barreiras financeiras ou técnicas.', color: 'from-rose-500 to-rose-600' },
    { icon: LineChart, title: 'Evolução Contínua', desc: 'Melhoramos constantemente com base no feedback dos nossos usuários.', color: 'from-amber-500 to-amber-600' },
  ];

  const differentiators = [
    { icon: PenLine, title: 'Correção inteligente de redações', desc: 'Receba notas, análises e sugestões de melhoria seguindo as 5 competências do ENEM.', color: 'from-blue-500 to-blue-600' },
    { icon: Brain, title: 'Estudos personalizados', desc: 'A IA adapta o aprendizado conforme sua evolução e suas dificuldades.', color: 'from-purple-500 to-purple-600' },
    { icon: BarChart3, title: 'Simulados reais', desc: 'Treine em um ambiente inspirado no ENEM, com questões autênticas dos anos anteriores.', color: 'from-emerald-500 to-emerald-600' },
    { icon: Target, title: 'Questões comentadas', desc: 'Aprenda com explicações detalhadas e comentários de cada questão.', color: 'from-amber-500 to-amber-600' },
    { icon: Cpu, title: 'IAs especializadas', desc: 'Cada ferramenta foi desenvolvida para resolver um tipo específico de problema.', color: 'from-cyan-500 to-cyan-600' },
    { icon: LineChart, title: 'Acompanhamento de desempenho', desc: 'Visualize sua evolução ao longo dos estudos com gráficos e estatísticas.', color: 'from-rose-500 to-rose-600' },
  ];

  const team = [
    {
      name: 'Fernando Anderson',
      role: 'Co-Fundador & Desenvolvedor Full Stack',
      desc: 'Responsável pela arquitetura do ApexEnem, desenvolvimento da plataforma e integração das inteligências artificiais.',
      initial: 'F',
      gradient: 'from-blue-500 to-purple-600',
      image: '/media/fernando-anderson.jpg',
    },
    {
      name: 'Otto Colonnelli',
      role: 'Co-Fundador & Desenvolvedor',
      desc: 'Atua no desenvolvimento da plataforma, contribuindo com código e soluções técnicas para o projeto.',
      initial: 'O',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      name: 'Giovanna Malgarin',
      role: 'Co-Fundadora & Designer',
      desc: 'Designer e ilustradora da plataforma, responsável pela identidade visual e pela experiência dos usuários.',
      initial: 'G',
      gradient: 'from-amber-500 to-orange-600',
      image: '/media/giovanna-malgarin.jpg',
    },
    {
      name: 'Miguel Alves',
      role: 'Co-Fundador & Pesquisador',
      desc: 'Pesquisador do projeto, dedicado à análise e ao levantamento de informações para a plataforma.',
      initial: 'M',
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  const numbers = [
    { icon: Cpu, value: '5+', label: 'Ferramentas inteligentes' },
    { icon: BookOpen, value: 'Milhares', label: 'de questões disponíveis' },
    { icon: PenLine, value: 'Correção', label: 'automática de redações' },
    { icon: Rocket, value: 'Contínuo', label: 'desenvolvimento da plataforma' },
  ];

  const techs = [
    {
      icon: Layers,
      title: 'Frontend',
      items: ['React', 'TypeScript', 'Tailwind CSS'],
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40',
    },
    {
      icon: Layers,
      title: 'Backend',
      items: ['Supabase', 'PostgreSQL'],
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40',
    },
    {
      icon: Brain,
      title: 'Inteligência Artificial',
      items: ['Modelos especializados', 'OCR', 'Correção de redação', 'Geração de questões'],
      color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40',
    },
    {
      icon: Rocket,
      title: 'Infraestrutura',
      items: ['Vercel', 'GitHub'],
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60',
    },
  ];

  const roadmap = [
    { icon: Layers, text: 'Plataforma Web', status: 'done' },
    { icon: PenLine, text: 'Correção de redação', status: 'done' },
    { icon: Target, text: 'Questões', status: 'done' },
    { icon: Brain, text: 'Plano de estudos inteligente', status: 'progress' },
    { icon: Smartphone, text: 'Aplicativo mobile', status: 'progress' },
    { icon: Mic, text: 'Professor virtual por voz', status: 'progress' },
    { icon: Sparkles, text: 'IA ainda mais personalizada', status: 'progress' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0814] text-slate-800 dark:text-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0814]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-2.5 cursor-pointer">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">Apex<span className="text-blue-600">Enem</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <button type="button" onClick={() => scrollTo('sobre-historia')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Sobre</button>
            <button type="button" onClick={() => scrollTo('sobre-diferenciais')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Diferenciais</button>
            <button type="button" onClick={() => scrollTo('sobre-equipe')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Equipe</button>
            <button type="button" onClick={() => scrollTo('sobre-futuro')} className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer">Futuro</button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onStart} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer">Entrar</button>
            <button type="button" onClick={onSignup} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer">Cadastrar</button>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#0a0814] dark:via-[#0f0a1e] dark:to-[#0a0814]" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px]" />
        <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Conheça o ApexEnem
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Inteligência artificial para transformar a preparação para o{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ENEM</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mb-10 leading-relaxed">
              Desenvolvida para transformar a forma como estudantes se preparam para o ENEM — com tecnologia gratuita, personalizada e acessível para todos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={onSignup} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-200/50 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer">
                Começar a estudar <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => scrollTo('sobre-diferenciais')} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
                Conhecer nossas ferramentas
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-400 font-mono">apexenem.vercel.app</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
                    <PenLine className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Correção de Redação</p>
                    <div className="flex gap-1 mt-1.5">
                      <div className="h-1.5 rounded-full bg-blue-400" style={{ width: '85%' }} />
                      <div className="h-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex-1" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">950/1000</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <div className="p-2 bg-purple-600 text-white rounded-lg shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Questão gerada por IA</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">"A Revolução Industrial..."</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Simulado — Matemática</p>
                    <div className="flex gap-1 mt-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: '72%' }} />
                      <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex-1" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">72%</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 p-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hidden sm:flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold">100% Gratuito</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="sobre-historia" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Nossa História</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed text-center max-w-3xl mx-auto">
            O ApexEnem surgiu da percepção de que muitos estudantes enfrentam dificuldades para estudar para o ENEM
            utilizando plataformas caras, pouco personalizadas ou que não acompanham sua evolução. Combinando
            tecnologia e educação, nossa equipe decidiu criar uma plataforma que reúne inteligência artificial,
            simulados, correção de redações e ferramentas de estudo em um único ambiente, oferecendo uma
            experiência moderna e personalizada para cada aluno.
          </motion.p>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="p-8 md:p-10 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold mb-5">
              <Target className="h-4 w-4" /> Nossa Missão
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Democratizar o acesso a uma preparação inteligente para o ENEM, utilizando inteligência artificial
              para oferecer um aprendizado mais eficiente, personalizado e acessível.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="p-8 md:p-10 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold mb-5">
              <Eye className="h-4 w-4" /> Nossa Visão
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Tornar-se uma das principais plataformas brasileiras de preparação para o ENEM, utilizando tecnologia
              para potencializar o aprendizado de milhões de estudantes.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Nossos Valores</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Os princípios que guiam cada decisão que tomamos.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div key={value.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition">
                <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${value.color} text-white mb-4`}>
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2">{value.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.4 }} className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col justify-center items-center text-center">
              <Shield className="h-6 w-6 mb-3" />
              <h3 className="text-base font-bold mb-1">100% Gratuito</h3>
              <p className="text-xs text-white/80 leading-relaxed">Acreditamos que educação de qualidade não deve ser privilégio de poucos.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="sobre-diferenciais" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">O que torna o ApexEnem diferente?</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Ferramentas pensadas para resolver problemas reais de quem estuda para o ENEM.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -4 }} className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition group">
                <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${item.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre-equipe" className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-6">
              <Users className="h-3.5 w-3.5" />
              Nossa Equipe
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Pessoas por trás do ApexEnem</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              O ApexEnem é desenvolvido por uma equipe que acredita que a tecnologia pode transformar a educação.
              Reunimos diferentes habilidades em programação, inteligência artificial, design e estratégia para
              construir uma plataforma que realmente faça diferença na preparação para o ENEM.
            </p>
          </motion.div>
          <div className="flex flex-col gap-20 md:gap-28 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16 group`}
              >
                <div className="relative w-full md:w-2/5 aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-700">
                  <div className={`absolute inset-0 bg-gradient-to-br ${member.gradient} opacity-90 transition-all duration-700 flex items-center justify-center`}>
                    <span className="text-8xl md:text-9xl font-extrabold text-white/90 drop-shadow-lg">{member.initial}</span>
                  </div>
                  {member.image && (
                    <img src={member.image} alt={member.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-700"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>

                <div className={`w-full md:w-3/5 text-center ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <div className={`flex items-center gap-3 mb-5 ${i % 2 === 0 ? 'justify-center md:justify-start' : 'justify-center md:justify-end'}`}>
                    <div className="w-10 h-px bg-blue-500/30"></div>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest">{member.role}</span>
                    <div className="w-10 h-px bg-blue-500/30"></div>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500">
                    {member.name}
                  </h3>
                  <div className="relative p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm group-hover:border-blue-400/40 transition-all duration-500">
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed italic">{member.desc}</p>
                    <span className="absolute -top-3 -left-2 text-5xl text-blue-500/20 font-serif">“</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Números do Projeto</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Uma plataforma em constante crescimento, construída para escalar.</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {numbers.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-center">
                <div className="mx-auto mb-3 p-2 w-fit bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">{item.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-slate-50/50 dark:bg-[#0f0a1e]/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Tecnologias</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Construído com ferramentas modernas e escaláveis.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techs.map((tech, i) => (
              <motion.div key={tech.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${tech.color}`}>
                  <tech.icon className="h-3.5 w-3.5" />
                  {tech.title}
                </div>
                <ul className="space-y-2">
                  {tech.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre-futuro" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Nosso Futuro</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">O MVP é apenas o começo. Veja o que estamos construindo.</p>
          </motion.div>
          <div className="space-y-4">
            {roadmap.map((item, i) => (
              <motion.div key={item.text} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
                <div className={`p-2.5 rounded-xl shrink-0 ${item.status === 'done' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold flex-1">{item.text}</span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${item.status === 'done' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                  {item.status === 'done' ? 'Concluído' : 'Em andamento'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Quer fazer parte dessa evolução?</h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
              O ApexEnem está em constante evolução. Estamos trabalhando todos os dias para oferecer uma
              experiência de aprendizagem cada vez mais inteligente, eficiente e acessível.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={onSignup} className="px-10 py-4 bg-white text-blue-700 font-bold text-sm rounded-xl transition shadow-xl hover:shadow-2xl flex items-center gap-2 cursor-pointer">
                Começar agora <ArrowRight className="h-4 w-4" />
              </motion.button>
              <button type="button" onClick={onStart} className="px-8 py-4 border border-white/30 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition cursor-pointer">
                Já tenho conta
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-4 w-4" />
              <span className="font-display font-extrabold tracking-tight">Apex<span className="text-blue-600">Enem</span></span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <button type="button" onClick={() => scrollTo('sobre-historia')} className="hover:text-blue-600 transition cursor-pointer">Contato</button>
              <button type="button" onClick={onBack} className="hover:text-blue-600 transition cursor-pointer">Início</button>
              <span className="hover:text-blue-600 transition cursor-pointer">Política de Privacidade</span>
              <span className="hover:text-blue-600 transition cursor-pointer">Termos de Uso</span>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">ApexEnem © 2026 — Plataforma Educacional Adaptativa</p>
            <p className="text-xs text-slate-400">Feito com 💙 para estudantes brasileiros</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
