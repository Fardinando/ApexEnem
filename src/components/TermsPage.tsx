import React from 'react';
import { GraduationCap, ScrollText } from 'lucide-react';

const TERM_SECTIONS = [
  {
    title: '1. Sobre o ApexEnem',
    paragraphs: [
      'O ApexEnem é uma plataforma educacional que utiliza inteligência artificial para auxiliar estudantes na preparação para o ENEM e outros vestibulares.',
    ],
    items: [
      'Correção de redações por Inteligência Artificial;',
      'Simulados;',
      'Questões reais e questões geradas por IA;',
      'Estudos personalizados;',
      'Geração de imagens para fins educacionais;',
      'Estatísticas de desempenho;',
      'Ferramentas de organização dos estudos;',
      'Recursos adicionais disponibilizados ao longo do desenvolvimento da plataforma.',
    ],
    note: 'O ApexEnem não possui vínculo oficial com o INEP, MEC ou qualquer instituição governamental.',
  },
  {
    title: '2. Cadastro',
    paragraphs: [
      'Para utilizar determinadas funcionalidades poderá ser necessário criar uma conta. O usuário declara que:',
    ],
    items: [
      'fornecerá informações verdadeiras;',
      'manterá seus dados atualizados;',
      'será responsável pela segurança de sua senha;',
      'não compartilhará sua conta com terceiros.',
    ],
    note: 'Caso seja identificado uso indevido da conta, o ApexEnem poderá suspendê-la ou encerrá-la.',
  },
  {
    title: '3. Uso da Plataforma',
    paragraphs: [
      'O usuário compromete-se a utilizar o ApexEnem apenas para fins legais e educacionais. É proibido:',
    ],
    items: [
      'tentar invadir, modificar ou comprometer a segurança da plataforma;',
      'utilizar robôs, scripts ou automações para sobrecarregar os servidores;',
      'copiar ou distribuir conteúdos da plataforma sem autorização;',
      'utilizar o serviço para fins ilegais;',
      'enviar vírus, malwares ou códigos maliciosos;',
      'tentar descobrir códigos-fonte, modelos de IA ou sistemas internos do ApexEnem;',
      'realizar engenharia reversa da plataforma, quando proibido por lei.',
    ],
    note: 'O descumprimento destas regras poderá resultar em suspensão ou encerramento da conta.',
  },
  {
    title: '4. Inteligência Artificial',
    paragraphs: [
      'O ApexEnem utiliza modelos de Inteligência Artificial para fornecer parte de seus serviços.',
      'Embora busquemos alta precisão, as respostas da IA podem conter erros, interpretações incorretas ou informações incompletas.',
      'O usuário reconhece que:',
    ],
    items: [
      'as respostas possuem caráter de apoio aos estudos;',
      'a IA não substitui professores ou especialistas;',
      'o usuário é responsável por verificar informações importantes antes de utilizá-las.',
    ],
  },
  {
    title: '5. Correção de Redações',
    paragraphs: [
      'As correções realizadas pela Inteligência Artificial possuem finalidade exclusivamente educacional. A nota fornecida pela plataforma:',
    ],
    items: [
      'não representa avaliação oficial do ENEM;',
      'não garante desempenho semelhante em provas oficiais;',
      'pode variar conforme atualizações dos modelos de IA.',
    ],
  },
  {
    title: '6. Disponibilidade do Serviço',
    paragraphs: [
      'O ApexEnem busca manter seus serviços disponíveis continuamente. Entretanto, poderão ocorrer interrupções devido a:',
    ],
    items: [
      'manutenção;',
      'atualizações;',
      'falhas de terceiros;',
      'problemas técnicos;',
      'eventos de força maior.',
    ],
    note: 'Não garantimos disponibilidade ininterrupta dos serviços.',
  },
  {
    title: '7. Serviços de Terceiros',
    paragraphs: [
      'Para o funcionamento da plataforma, o ApexEnem utiliza serviços fornecidos por terceiros, incluindo:',
    ],
    items: [
      'Supabase, para autenticação, banco de dados e armazenamento de informações necessárias ao funcionamento da plataforma;',
      'Vercel, para hospedagem, distribuição e infraestrutura do serviço;',
      'OpenRouter, para encaminhamento de solicitações aos modelos de Inteligência Artificial utilizados pelo ApexEnem.',
    ],
    note: 'Esses serviços possuem políticas próprias de privacidade e tratamento de dados, pelas quais são responsáveis.',
  },
  {
    title: '8. Propriedade Intelectual',
    paragraphs: [
      'Todo o conteúdo da plataforma, incluindo:',
    ],
    items: [
      'logotipos;',
      'identidade visual;',
      'códigos;',
      'algoritmos;',
      'banco de dados;',
      'design;',
      'textos;',
      'recursos exclusivos.',
    ],
    note: 'É proibida a reprodução, distribuição ou utilização desses materiais sem autorização expressa do ApexEnem.',
  },
  {
    title: '9. Conteúdo Enviado pelo Usuário',
    paragraphs: [
      'O usuário permanece proprietário dos conteúdos enviados à plataforma, como redações, respostas e arquivos.',
      'Ao utilizar o ApexEnem, o usuário concede autorização para que tais conteúdos sejam processados pela plataforma exclusivamente para:',
    ],
    items: [
      'fornecer os serviços contratados;',
      'melhorar funcionalidades da plataforma;',
      'processar solicitações por meio dos modelos de Inteligência Artificial disponibilizados através da infraestrutura do OpenRouter;',
      'aperfeiçoar recursos internos do ApexEnem, quando permitido pela legislação aplicável e respeitados os direitos dos titulares dos dados.',
    ],
    note: [
      'O ApexEnem não utilizará conteúdos enviados pelos usuários para treinamento de modelos próprios de Inteligência Artificial sem informar claramente essa finalidade ou quando isso depender do consentimento do usuário.',
      'Sempre que possível, os dados utilizados para melhoria dos serviços serão tratados de forma segura e conforme nossa Política de Privacidade.',
    ],
  },
  {
    title: '10. Privacidade',
    paragraphs: [
      'O tratamento de dados pessoais é realizado conforme nossa Política de Privacidade e em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
      'Ao utilizar o ApexEnem, o usuário declara estar ciente dessa política.',
    ],
  },
  {
    title: '11. Limitação de Responsabilidade',
    paragraphs: [
      'Na máxima extensão permitida pela legislação brasileira, o ApexEnem não será responsável por:',
    ],
    items: [
      'decisões tomadas exclusivamente com base nas respostas da IA;',
      'perdas decorrentes do uso inadequado da plataforma;',
      'indisponibilidade causada por terceiros;',
      'falhas de conexão do usuário;',
      'danos provocados por uso indevido da conta.',
    ],
  },
  {
    title: '12. Atualizações dos Termos',
    paragraphs: [
      'Estes Termos de Uso poderão ser modificados a qualquer momento.',
      'Quando houver alterações relevantes, os usuários poderão ser informados pelos meios disponibilizados na plataforma.',
      'O uso continuado do ApexEnem após as alterações representa concordância com os novos Termos.',
    ],
  },
  {
    title: '13. Encerramento de Conta',
    paragraphs: [
      'O usuário poderá solicitar o encerramento de sua conta a qualquer momento.',
      'O ApexEnem poderá suspender ou encerrar contas que violem estes Termos ou utilizem a plataforma de maneira fraudulenta ou abusiva.',
    ],
  },
  {
    title: '14. Legislação Aplicável',
    paragraphs: [
      'Estes Termos são regidos pelas leis da República Federativa do Brasil.',
      'Eventuais controvérsias serão solucionadas conforme a legislação brasileira aplicável.',
    ],
  },
  {
    title: '15. Contato',
    paragraphs: [
      'Caso tenha dúvidas sobre estes Termos de Uso, entre em contato pelos canais oficiais disponibilizados pelo ApexEnem.',
    ],
  },
];

export default function TermsPage({
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400 mb-6">
              <ScrollText className="h-3.5 w-3.5" />
              Documento Legal
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Termos de Uso</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              <strong className="text-slate-700 dark:text-slate-300">Última atualização:</strong> 05 de agosto de 2026
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8" />
            <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 leading-relaxed">
              <p className="font-semibold mb-2">Bem-vindo ao ApexEnem!</p>
              <p className="text-slate-600 dark:text-slate-300">
                Ao acessar ou utilizar nossa plataforma, você concorda com os presentes Termos de Uso.
                Caso não concorde com qualquer disposição deste documento, recomendamos que não utilize nossos serviços.
              </p>
            </div>
          </div>

          <nav className="mb-12 p-4 rounded-2xl bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Índice</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {TERM_SECTIONS.map((section) => (
                <li key={section.title}>
                  <button type="button" onClick={() => scrollTo('sec-' + section.title.split('.')[0])} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left">
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {TERM_SECTIONS.map((section) => (
              <section key={section.title} id={'sec-' + section.title.split('.')[0]} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">{section.title}</h2>
                <div className="space-y-3">
                  {section.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">{p}</p>
                  ))}
                  {section.items && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.note && (Array.isArray(section.note)
                    ? section.note.map((n, i) => (
                        <p key={i} className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{n}</p>
                      ))
                    : <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">{section.note}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white text-center">
            <p className="text-base md:text-lg font-medium leading-relaxed">
              Ao utilizar o ApexEnem, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.
            </p>
            <button type="button" onClick={onSignup} className="mt-6 px-8 py-3 bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold rounded-xl transition cursor-pointer shadow-lg">
              Concordo e quero criar minha conta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
