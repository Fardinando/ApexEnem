import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';

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
  tail?: {
    paragraphs?: string[];
    items?: string[];
  };
}

const PRIVACY_SECTIONS: Section[] = [
  {
    title: '1. Quem somos',
    paragraphs: [
      'O ApexEnem é uma plataforma educacional desenvolvida para auxiliar estudantes na preparação para o ENEM e outros vestibulares por meio de recursos tecnológicos e Inteligência Artificial.',
      'Caso tenha dúvidas sobre esta Política, você poderá entrar em contato pelos canais oficiais disponibilizados na plataforma.',
    ],
  },
  {
    title: '2. Dados que coletamos',
    paragraphs: [
      'Dependendo da forma como você utiliza o ApexEnem, poderemos coletar as seguintes informações:',
    ],
    subsections: [
      {
        title: 'Dados fornecidos pelo usuário',
        items: [
          'Nome;',
          'Endereço de e-mail;',
          'Senha (armazenada de forma protegida e nunca em texto puro);',
          'Foto de perfil (quando enviada);',
          'Data de nascimento (quando informada);',
          'Conteúdos enviados, como redações, respostas, arquivos e mensagens;',
          'Preferências de estudo.',
        ],
      },
      {
        title: 'Dados coletados automaticamente',
        items: [
          'Endereço IP;',
          'Tipo de navegador;',
          'Sistema operacional;',
          'Informações do dispositivo;',
          'Idioma;',
          'Data e horário de acesso;',
          'Páginas acessadas;',
          'Tempo de utilização da plataforma;',
          'Registros de erros (logs);',
          'Cookies e tecnologias semelhantes.',
        ],
      },
      {
        title: 'Dados gerados durante o uso',
        paragraphs: ['Também poderão ser registrados:'],
        items: [
          'Histórico de simulados;',
          'Notas de redação;',
          'Estatísticas de desempenho;',
          'Histórico de estudos;',
          'Questões respondidas;',
          'Interações com recursos de Inteligência Artificial.',
        ],
      },
    ],
  },
  {
    title: '3. Como utilizamos seus dados',
    paragraphs: ['Os dados pessoais poderão ser utilizados para:'],
    items: [
      'criar e gerenciar sua conta;',
      'fornecer os serviços do ApexEnem;',
      'corrigir redações;',
      'gerar conteúdos personalizados;',
      'recomendar materiais de estudo;',
      'melhorar a experiência do usuário;',
      'desenvolver novas funcionalidades;',
      'prevenir fraudes;',
      'garantir a segurança da plataforma;',
      'cumprir obrigações legais;',
      'responder solicitações de suporte.',
    ],
  },
  {
    title: '4. Inteligência Artificial',
    paragraphs: [
      'Alguns recursos do ApexEnem utilizam Inteligência Artificial para fornecer respostas, corrigir redações, gerar questões, produzir imagens e personalizar estudos.',
      'Os dados enviados pelo usuário poderão ser processados por modelos de IA exclusivamente para fornecer os serviços solicitados.',
      'Quando permitido pela legislação e pelas configurações da plataforma, dados poderão ser utilizados para aprimorar a qualidade dos serviços e dos modelos utilizados, sempre adotando medidas de segurança e proteção compatíveis com a LGPD.',
      'O ApexEnem procura compartilhar apenas as informações estritamente necessárias para o processamento de cada solicitação enviada aos modelos de IA.',
    ],
  },
  {
    title: '5. Compartilhamento de dados',
    paragraphs: [
      'O ApexEnem não vende, aluga ou comercializa dados pessoais.',
      'Os dados poderão ser compartilhados apenas quando necessário para a prestação dos serviços ou para o cumprimento de obrigações legais.',
      'Atualmente, utilizamos os seguintes fornecedores:',
    ],
    subsections: [
      {
        title: 'Supabase',
        paragraphs: ['Responsável pelos serviços de autenticação, banco de dados e armazenamento das informações da plataforma.'],
      },
      {
        title: 'Vercel',
        paragraphs: ['Responsável pela hospedagem, infraestrutura e distribuição do ApexEnem.'],
      },
      {
        title: 'OpenRouter',
        paragraphs: [
          'Utilizado para encaminhar solicitações aos modelos de Inteligência Artificial utilizados pela plataforma.',
          'Dependendo do recurso utilizado, informações enviadas pelo usuário poderão ser transmitidas ao OpenRouter exclusivamente para processamento da solicitação realizada.',
        ],
      },
    ],
    tail: {
      paragraphs: ['Além desses fornecedores, dados poderão ser compartilhados:'],
      items: [
        'quando exigido por lei;',
        'mediante ordem judicial;',
        'para exercício regular de direitos em processos judiciais, administrativos ou arbitrais.',
      ],
    },
  },
  {
    title: '6. Cookies',
    paragraphs: ['Utilizamos cookies e tecnologias semelhantes para:'],
    items: [
      'manter o usuário autenticado;',
      'lembrar preferências;',
      'melhorar o desempenho da plataforma;',
      'analisar estatísticas de utilização;',
      'aumentar a segurança;',
      'oferecer uma melhor experiência de navegação.',
    ],
    note: 'O usuário poderá gerenciar os cookies diretamente em seu navegador, embora algumas funcionalidades possam deixar de funcionar corretamente.',
  },
  {
    title: '7. Segurança das informações',
    paragraphs: [
      'O ApexEnem adota medidas técnicas e administrativas destinadas a proteger os dados pessoais contra acesso não autorizado, perda, alteração, destruição ou divulgação indevida.',
      'Essas medidas podem incluir:',
    ],
    items: [
      'criptografia durante a transmissão de dados;',
      'armazenamento seguro;',
      'controle de acesso;',
      'monitoramento de atividades suspeitas;',
      'backups periódicos;',
      'autenticação de usuários.',
    ],
    note: 'Apesar dos esforços empregados, nenhum sistema é completamente imune a riscos de segurança.',
  },
  {
    title: '8. Tempo de armazenamento',
    paragraphs: ['Os dados pessoais serão armazenados apenas pelo tempo necessário para:'],
    items: [
      'fornecer os serviços;',
      'cumprir obrigações legais;',
      'resolver disputas;',
      'exercer direitos em processos administrativos ou judiciais;',
      'preservar a segurança da plataforma.',
    ],
    note: 'Quando não houver mais necessidade de tratamento, os dados poderão ser excluídos ou anonimizados, conforme permitido pela legislação.',
  },
  {
    title: '9. Direitos do titular dos dados',
    paragraphs: ['Nos termos da LGPD, o usuário poderá solicitar:'],
    items: [
      'confirmação da existência de tratamento;',
      'acesso aos seus dados pessoais;',
      'correção de dados incompletos, inexatos ou desatualizados;',
      'anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a lei;',
      'portabilidade dos dados, quando aplicável;',
      'eliminação dos dados tratados com base no consentimento, observadas as exceções legais;',
      'informação sobre o compartilhamento de dados;',
      'revogação do consentimento, quando esta for a base legal do tratamento.',
    ],
    note: 'As solicitações serão analisadas dentro dos prazos previstos na legislação.',
  },
  {
    title: '10. Crianças e adolescentes',
    paragraphs: [
      'O ApexEnem pode ser utilizado por menores de idade.',
      'Quando exigido pela legislação aplicável, o tratamento de dados pessoais de crianças será realizado mediante autorização ou acompanhamento de seus pais ou responsáveis legais.',
    ],
  },
  {
    title: '11. Transferência internacional de dados',
    paragraphs: [
      'Alguns dos serviços utilizados pelo ApexEnem poderão processar ou armazenar dados em servidores localizados fora do Brasil.',
      'Isso pode ocorrer, por exemplo, quando uma solicitação é encaminhada ao OpenRouter ou quando a infraestrutura utilizada opera centros de dados internacionais.',
      'Nesses casos, o ApexEnem busca utilizar fornecedores que adotem padrões adequados de proteção de dados e mecanismos compatíveis com a Lei Geral de Proteção de Dados (LGPD).',
    ],
  },
  {
    title: '12. Alterações desta Política',
    paragraphs: [
      'Esta Política de Privacidade poderá ser atualizada periodicamente.',
      'Sempre que houver alterações relevantes, os usuários poderão ser informados por meio da plataforma ou pelos canais de comunicação disponíveis.',
      'A versão mais recente estará sempre disponível no ApexEnem.',
    ],
  },
  {
    title: '13. Contato',
    paragraphs: [
      'Caso tenha dúvidas, queira exercer seus direitos previstos na LGPD ou solicitar informações sobre o tratamento de seus dados pessoais, entre em contato pelos canais oficiais disponibilizados pelo ApexEnem.',
    ],
  },
];

export default function PrivacyPage({
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              LGPD · Lei nº 13.709/2018
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Política de Privacidade</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              <strong className="text-slate-700 dark:text-slate-300">Última atualização:</strong> 05 de agosto de 2026
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full mb-8" />
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 leading-relaxed">
              <p className="font-semibold mb-2">Sua privacidade importa</p>
              <p className="text-slate-600 dark:text-slate-300">
                Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos, compartilhamos e protegemos
                suas informações, em conformidade com a LGPD. Ao utilizar o ApexEnem, você declara estar ciente das
                práticas descritas nesta Política.
              </p>
            </div>
          </div>

          <nav className="mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Índice</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {PRIVACY_SECTIONS.map((section) => (
                <li key={section.title}>
                  <button type="button" onClick={() => scrollTo('sec-' + section.title.split('.')[0])} className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-left">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {PRIVACY_SECTIONS.map((section) => (
              <section key={section.title} id={'sec-' + section.title.split('.')[0]} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs?.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                  ))}
                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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
                  {section.tail && (
                    <div className="pt-3 space-y-3">
                      {section.tail.paragraphs?.map((p, k) => (
                        <p key={k} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                      ))}
                      {section.tail.items && (
                        <ul className="space-y-2 pl-1">
                          {section.tail.items.map((item, k) => (
                            <li key={k} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {section.note && (
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{section.note}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-600 to-blue-600 text-white text-center">
            <p className="text-base md:text-lg font-medium leading-relaxed">
              Ao utilizar o ApexEnem, você declara que leu esta Política de Privacidade e compreendeu como seus dados pessoais são tratados.
            </p>
            <button type="button" onClick={onSignup} className="mt-6 px-8 py-3 bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-bold rounded-xl transition cursor-pointer shadow-lg">
              Entendi e quero criar minha conta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
