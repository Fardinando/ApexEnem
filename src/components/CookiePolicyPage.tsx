import React from 'react';
import { GraduationCap, Cookie } from 'lucide-react';

interface SubSection {
  title?: string;
  paragraphs?: string[];
  items?: string[];
  note?: string;
}

interface Section {
  title: string;
  paragraphs?: string[];
  items?: string[];
  subsections?: SubSection[];
  note?: string;
}

const COOKIE_SECTIONS: Section[] = [
  {
    title: '1. O que são cookies?',
    paragraphs: [
      'Cookies são pequenos arquivos de texto armazenados em seu dispositivo (computador, celular ou tablet) quando você visita um site.',
      'Eles permitem que a plataforma reconheça seu navegador, memorize preferências e melhore sua experiência de navegação.',
      'Além dos cookies, o ApexEnem poderá utilizar tecnologias semelhantes, como armazenamento local (Local Storage), Session Storage e identificadores temporários, sempre em conformidade com a legislação aplicável.',
    ],
  },
  {
    title: '2. Quais cookies utilizamos?',
    paragraphs: ['O ApexEnem poderá utilizar as seguintes categorias de cookies:'],
    subsections: [
      {
        title: 'Cookies Essenciais',
        paragraphs: ['São indispensáveis para o funcionamento da plataforma. Esses cookies permitem, por exemplo:'],
        items: [
          'autenticação de usuários;',
          'manutenção da sessão de login;',
          'proteção contra ataques e fraudes;',
          'balanceamento de carga;',
          'funcionamento de recursos essenciais.',
        ],
        note: 'A desativação desses cookies poderá impedir o funcionamento correto do ApexEnem.',
      },
      {
        title: 'Cookies de Preferências',
        paragraphs: ['Permitem lembrar escolhas feitas pelo usuário, como:'],
        items: [
          'idioma;',
          'tema (claro ou escuro);',
          'preferências de estudo;',
          'configurações da plataforma.',
        ],
        note: 'Esses cookies tornam a navegação mais personalizada.',
      },
      {
        title: 'Cookies de Desempenho e Estatísticas',
        paragraphs: ['São utilizados para compreender como os usuários utilizam o ApexEnem. Esses dados podem incluir:'],
        items: [
          'páginas mais acessadas;',
          'tempo de permanência;',
          'recursos utilizados;',
          'origem do acesso;',
          'erros encontrados.',
        ],
        note: 'Sempre que possível, essas informações serão utilizadas de forma agregada ou anonimizada.',
      },
      {
        title: 'Cookies de Segurança',
        paragraphs: ['São utilizados para:'],
        items: [
          'identificar atividades suspeitas;',
          'prevenir fraudes;',
          'proteger contas de usuários;',
          'detectar acessos não autorizados.',
        ],
      },
      {
        title: 'Cookies de Funcionalidade',
        paragraphs: ['Permitem oferecer recursos adicionais da plataforma, incluindo:'],
        items: [
          'integração com serviços externos;',
          'salvamento automático de informações;',
          'carregamento de conteúdos personalizados.',
        ],
      },
    ],
  },
  {
    title: '3. Cookies de terceiros',
    paragraphs: [
      'O ApexEnem poderá utilizar serviços fornecidos por terceiros que também podem armazenar cookies em seu dispositivo.',
      'Esses serviços poderão incluir, entre outros:',
    ],
    items: [
      'serviços de autenticação;',
      'provedores de hospedagem;',
      'ferramentas de análise de acesso;',
      'plataformas de processamento de pagamentos;',
      'provedores de Inteligência Artificial;',
      'serviços de monitoramento de desempenho;',
      'ferramentas de suporte ao usuário.',
    ],
    note: 'Cada fornecedor possui suas próprias políticas de privacidade e de cookies, pelas quais é responsável.',
  },
  {
    title: '4. Como utilizamos os cookies?',
    paragraphs: ['Os cookies podem ser utilizados para:'],
    items: [
      'manter o usuário autenticado;',
      'lembrar preferências;',
      'melhorar a experiência de navegação;',
      'aumentar a segurança da plataforma;',
      'medir o desempenho do sistema;',
      'identificar falhas técnicas;',
      'personalizar funcionalidades;',
      'compreender como os serviços são utilizados;',
      'aperfeiçoar continuamente o ApexEnem.',
    ],
  },
  {
    title: '5. Gerenciamento de cookies',
    paragraphs: [
      'O usuário poderá controlar ou excluir cookies diretamente nas configurações de seu navegador.',
      'Também poderá configurar seu navegador para bloquear parcialmente ou totalmente os cookies.',
      'Entretanto, a desativação de determinados cookies poderá afetar o funcionamento da plataforma e limitar algumas funcionalidades.',
    ],
  },
  {
    title: '6. Base legal para utilização dos cookies',
    paragraphs: [
      'O tratamento de dados relacionados aos cookies será realizado conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
      'Os cookies poderão ser utilizados com fundamento em:',
    ],
    items: [
      'execução do contrato para funcionamento da plataforma;',
      'legítimo interesse do ApexEnem, quando permitido pela legislação;',
      'consentimento do usuário, quando exigido.',
    ],
  },
  {
    title: '7. Alterações nesta Política',
    paragraphs: [
      'Esta Política de Cookies poderá ser atualizada periodicamente para refletir mudanças na legislação, na tecnologia utilizada ou nos serviços oferecidos pelo ApexEnem.',
      'A versão mais recente estará sempre disponível na plataforma.',
    ],
  },
  {
    title: '8. Contato',
    paragraphs: [
      'Caso tenha dúvidas sobre esta Política de Cookies ou sobre o tratamento de dados relacionados ao uso de cookies, entre em contato pelos canais oficiais disponibilizados pelo ApexEnem.',
    ],
  },
];

export default function CookiePolicyPage({
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400 mb-6">
              <Cookie className="h-3.5 w-3.5" />
              Cookies e tecnologias semelhantes
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Política de Cookies</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              <strong className="text-slate-700 dark:text-slate-300">Última atualização:</strong> 05 de agosto de 2026
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-blue-600 rounded-full mb-8" />
            <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 leading-relaxed">
              <p className="font-semibold mb-2">Sobre esta política</p>
              <p className="text-slate-600 dark:text-slate-300">
                O ApexEnem utiliza cookies e tecnologias semelhantes para oferecer uma melhor experiência aos usuários,
                garantir o funcionamento da plataforma e compreender como nossos serviços são utilizados.
                Ao continuar utilizando o ApexEnem, você concorda com o uso de cookies conforme descrito nesta Política.
              </p>
            </div>
          </div>

          <nav className="mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Índice</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {COOKIE_SECTIONS.map((section) => (
                <li key={section.title}>
                  <button type="button" onClick={() => scrollTo('sec-' + section.title.split('.')[0])} className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer text-left">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {COOKIE_SECTIONS.map((section) => (
              <section key={section.title} id={'sec-' + section.title.split('.')[0]} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-amber-600 dark:text-amber-400">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                  ))}
                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.subsections?.map((sub, i) => (
                    <div key={i} className={i > 0 ? 'pt-3' : ''}>
                      {sub.title && (
                        <h3 className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">{sub.title}</h3>
                      )}
                      <div className="space-y-3">
                        {sub.paragraphs?.map((p, j) => (
                          <p key={j} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                        ))}
                        {sub.items && (
                          <ul className="space-y-2 pl-1">
                            {sub.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {sub.note && (
                          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{sub.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {section.note && (
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{section.note}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-amber-500 to-blue-600 text-white text-center">
            <p className="text-base md:text-lg font-medium leading-relaxed">
              Ao utilizar o ApexEnem, o usuário declara estar ciente desta Política de Cookies e do uso de cookies e tecnologias semelhantes conforme aqui descrito.
            </p>
            <button type="button" onClick={onSignup} className="mt-6 px-8 py-3 bg-white text-amber-600 hover:bg-amber-50 text-sm font-bold rounded-xl transition cursor-pointer shadow-lg">
              Entendi e quero criar minha conta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
