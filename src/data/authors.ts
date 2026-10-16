export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
  links?: { label: string; url: string }[];
}

export const AUTHORS: Author[] = [
  {
    slug: 'fernando-anderson',
    name: 'Fernando Anderson',
    role: 'Co-Fundador & Desenvolvedor Full Stack',
    bio: 'Responsável pela arquitetura do ApexEnem, desenvolvimento da plataforma e integração das inteligências artificiais. Escreve sobre tecnologia educacional, metodologias de estudo e preparação para o ENEM.',
    photo: '/media/fernando-anderson.jpg',
    links: [
      { label: 'GitHub', url: 'https://github.com/Fardinando' },
    ],
  },
  {
    slug: 'ottoni-colonnelli',
    name: 'Otto Colonnelli',
    role: 'Co-Fundador & Desenvolvedor',
    bio: 'Atua no desenvolvimento da plataforma, contribuindo com código e soluções técnicas para o projeto. Interessa-se por aprendizado adaptativo e ferramentas que tornam o estudo mais eficiente.',
  },
  {
    slug: 'giovanna-malgarin',
    name: 'Giovanna Malgarin',
    role: 'Co-Fundadora & Designer',
    bio: 'Designer e ilustradora da plataforma, responsável pela identidade visual e pela experiência dos usuários. Escreve sobre produtividade, organização de estudos e motivação.',
    photo: '/media/giovanna-malgarin.jpg',
  },
  {
    slug: 'miguel-alves',
    name: 'Miguel Alves',
    role: 'Co-Fundador & Pesquisador',
    bio: 'Pesquisador do projeto, dedicado à análise e ao levantamento de informações para a plataforma. Ajuda a transformar dados e evidências em recomendações práticas de estudo.',
  },
];

export function getAuthor(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}
