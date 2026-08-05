import React from 'react';
import { GraduationCap, RotateCcw } from 'lucide-react';

interface Section {
  title: string;
  paragraphs?: string[];
  items?: string[];
  note?: string;
}

const REFUND_SECTIONS: Section[] = [
  {
    title: '1. Objetivo',
    paragraphs: [
      'A presente Política busca garantir transparência e segurança nas relações entre o ApexEnem e seus usuários em relação aos pagamentos realizados.',
    ],
  },
  {
    title: '2. Direito ao Reembolso',
    paragraphs: [
      'Quando aplicável, o usuário poderá solicitar reembolso nas hipóteses previstas pela legislação brasileira e pelas condições específicas informadas durante a contratação.',
      'Cada solicitação será analisada individualmente.',
    ],
  },
  {
    title: '3. Situações que poderão permitir reembolso',
    paragraphs: ['Poderão ser consideradas, entre outras:'],
    items: [
      'cobrança em duplicidade;',
      'cobrança realizada por erro da plataforma;',
      'falha técnica que impeça permanentemente a utilização do serviço contratado;',
      'outras situações previstas em lei.',
    ],
  },
  {
    title: '4. Situações em que o reembolso poderá não ser concedido',
    paragraphs: ['Salvo disposição legal em contrário, poderão não gerar direito ao reembolso:'],
    items: [
      'arrependimento após utilização significativa dos recursos contratados;',
      'descumprimento dos Termos de Uso;',
      'suspensão da conta por fraude ou uso abusivo;',
      'solicitações incompatíveis com esta Política ou com a legislação aplicável.',
    ],
  },
  {
    title: '5. Como solicitar',
    paragraphs: [
      'O pedido deverá ser realizado pelos canais oficiais de atendimento do ApexEnem.',
      'O usuário poderá ser solicitado a fornecer informações que permitam localizar a transação.',
    ],
  },
  {
    title: '6. Forma de restituição',
    paragraphs: [
      'Quando aprovado, o reembolso será realizado, sempre que possível, utilizando o mesmo meio de pagamento empregado na compra.',
      'O prazo poderá variar conforme o método de pagamento e as instituições financeiras envolvidas.',
    ],
  },
  {
    title: '7. Análise das solicitações',
    paragraphs: ['Cada solicitação será analisada individualmente, considerando:'],
    items: [
      'a legislação aplicável;',
      'as condições da contratação;',
      'o histórico da transação;',
      'eventuais evidências de uso indevido ou fraude.',
    ],
  },
  {
    title: '8. Alterações desta Política',
    paragraphs: [
      'O ApexEnem poderá atualizar esta Política sempre que necessário.',
      'A versão mais recente permanecerá disponível na plataforma.',
    ],
  },
  {
    title: '9. Contato',
    paragraphs: [
      'Em caso de dúvidas sobre pagamentos ou reembolsos, entre em contato pelos canais oficiais disponibilizados pelo ApexEnem.',
    ],
  },
];

export default function RefundPolicyPage({
  onBack,
  onSignup,
}: {
  onBack: () => void;
  onSignup?: () => void;
}) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0814] text-slate-800 dark:text-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0814]/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-2.5 cursor-pointer">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight">Apex<span className="text-blue-600">Enem</span></span>
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onSignup} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer">Criar conta</button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-400 mb-6">
              <RotateCcw className="h-3.5 w-3.5" />
              Pagamentos e reembolsos
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Política de Reembolso</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              <strong className="text-slate-700 dark:text-slate-300">Última atualização:</strong> 05 de agosto de 2026
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-rose-600 to-indigo-600 rounded-full mb-8" />
            <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 leading-relaxed">
              <p className="font-semibold mb-2">Situação atual</p>
              <p className="text-slate-600 dark:text-slate-300">
                Esta Política estabelece as regras para solicitações de reembolso referentes aos serviços pagos do ApexEnem.
                <strong className="text-slate-700 dark:text-slate-200"> Atualmente, o ApexEnem não oferece planos pagos.</strong>{' '}
                Esta Política passará a ser aplicada quando assinaturas ou outros serviços pagos forem disponibilizados.
              </p>
            </div>
          </div>

          <nav className="mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Índice</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {REFUND_SECTIONS.map((section) => (
                <li key={section.title}>
                  <button type="button" onClick={() => scrollTo('sec-' + section.title.split('.')[0])} className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer text-left">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {REFUND_SECTIONS.map((section) => (
              <section key={section.title} id={'sec-' + section.title.split('.')[0]} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-rose-600 dark:text-rose-400">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                  ))}
                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.note && (
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{section.note}</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
