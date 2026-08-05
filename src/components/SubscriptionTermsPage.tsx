import React from 'react';
import { GraduationCap, CreditCard } from 'lucide-react';

interface Section {
  title: string;
  paragraphs?: string[];
  items?: string[];
  note?: string;
}

const SUBSCRIPTION_SECTIONS: Section[] = [
  {
    title: '1. Objeto',
    paragraphs: [
      'Os presentes Termos regulam a contratação de planos pagos, assinaturas, recursos premium e demais serviços oferecidos pelo ApexEnem.',
    ],
  },
  {
    title: '2. Planos',
    paragraphs: [
      'O ApexEnem poderá oferecer diferentes modalidades de assinatura, incluindo planos mensais, anuais ou outras opções que venham a ser disponibilizadas.',
      'As características, benefícios, preços e limitações de cada plano serão informados antes da contratação.',
    ],
  },
  {
    title: '3. Preços',
    paragraphs: [
      'Os preços serão apresentados de forma clara antes da conclusão da compra.',
      'Todos os valores serão informados na moeda indicada durante a contratação.',
      'O ApexEnem poderá alterar os preços de seus planos, respeitando a legislação aplicável e comunicando previamente os usuários quando necessário.',
    ],
  },
  {
    title: '4. Pagamentos',
    paragraphs: [
      'Os pagamentos poderão ser realizados pelos meios disponibilizados na plataforma.',
      'O processamento dos pagamentos poderá ser realizado por empresas especializadas, responsáveis pelo tratamento seguro das transações financeiras.',
      'O ApexEnem não armazena dados completos de cartões de crédito ou outros meios de pagamento quando estes forem processados diretamente por terceiros.',
    ],
  },
  {
    title: '5. Renovação',
    paragraphs: [
      'Quando um plano possuir renovação automática, essa informação será apresentada ao usuário antes da contratação.',
      'O usuário poderá cancelar a renovação automática conforme as opções disponibilizadas na plataforma.',
    ],
  },
  {
    title: '6. Cancelamento',
    paragraphs: [
      'O usuário poderá solicitar o cancelamento da assinatura a qualquer momento pelos meios disponibilizados pelo ApexEnem.',
      'O cancelamento impedirá futuras cobranças, mas não gera automaticamente direito ao reembolso, observadas as regras previstas na Política de Reembolso.',
    ],
  },
  {
    title: '7. Alterações dos Planos',
    paragraphs: [
      'O ApexEnem poderá modificar, substituir ou descontinuar planos, funcionalidades ou benefícios.',
      'Sempre que possível, os usuários serão informados previamente sobre alterações relevantes.',
    ],
  },
  {
    title: '8. Suspensão',
    paragraphs: ['O acesso aos recursos pagos poderá ser suspenso em caso de:'],
    items: [
      'inadimplência;',
      'fraude;',
      'violação dos Termos de Uso;',
      'utilização abusiva da plataforma.',
    ],
  },
  {
    title: '9. Tributos',
    paragraphs: [
      'Os valores apresentados poderão incluir os tributos aplicáveis conforme a legislação vigente.',
    ],
  },
  {
    title: '10. Alterações destes Termos',
    paragraphs: [
      'Este documento poderá ser atualizado periodicamente para refletir alterações nos serviços, planos ou legislação aplicável.',
      'A versão mais recente estará sempre disponível no ApexEnem.',
    ],
  },
  {
    title: '11. Contato',
    paragraphs: [
      'Em caso de dúvidas relacionadas a assinaturas ou pagamentos, o usuário poderá entrar em contato pelos canais oficiais disponibilizados pelo ApexEnem.',
    ],
  },
];

export default function SubscriptionTermsPage({
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-full text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-6">
              <CreditCard className="h-3.5 w-3.5" />
              Planos pagos e assinaturas
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Termos de Assinatura e Pagamentos</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              <strong className="text-slate-700 dark:text-slate-300">Última atualização:</strong> 05 de agosto de 2026
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full mb-8" />
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 leading-relaxed">
              <p className="font-semibold mb-2">Situação atual</p>
              <p className="text-slate-600 dark:text-slate-300">
                Este documento estabelece as regras aplicáveis aos planos pagos, assinaturas e demais serviços comercializados pelo ApexEnem.
                <strong className="text-slate-700 dark:text-slate-200"> Atualmente, o ApexEnem disponibiliza seus recursos gratuitamente.</strong>{' '}
                As disposições deste documento passarão a produzir efeitos quando planos pagos ou assinaturas forem disponibilizados aos usuários.
              </p>
            </div>
          </div>

          <nav className="mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Índice</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {SUBSCRIPTION_SECTIONS.map((section) => (
                <li key={section.title}>
                  <button type="button" onClick={() => scrollTo('sec-' + section.title.split('.')[0])} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer text-left">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {SUBSCRIPTION_SECTIONS.map((section) => (
              <section key={section.title} id={'sec-' + section.title.split('.')[0]} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                  ))}
                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
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
