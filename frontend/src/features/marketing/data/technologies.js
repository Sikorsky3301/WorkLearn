// The technology strip under the hero.
//
// Marks are served from public/images/tech/ as plain URLs rather than bundled
// imports, so a logo can be added or swapped by dropping a file in that folder
// — the same arrangement as the domain photographs and institution crests.
//
// All seventeen are single-path monochrome marks (simple-icons style, 24×24),
// which is what lets the strip render them at one weight without any of them
// shouting. A full-colour logo dropped in here would break that immediately —
// convert it to a single path first.
//
// `name` is the display caption, spelled the way the project spells itself:
// "Node.js", not "nodedotjs"; "C++", not "cplusplus". The filename is a slug,
// not a brand.
export const TECHNOLOGIES = [
  { key: 'python', name: 'Python', logo: '/images/tech/python.svg' },
  { key: 'javascript', name: 'JavaScript', logo: '/images/tech/javascript.svg' },
  { key: 'react', name: 'React', logo: '/images/tech/react.svg' },
  { key: 'nodedotjs', name: 'Node.js', logo: '/images/tech/nodedotjs.svg' },
  { key: 'cplusplus', name: 'C++', logo: '/images/tech/cplusplus.svg' },
  { key: 'rubyonrails', name: 'Ruby on Rails', logo: '/images/tech/rubyonrails.svg' },
  { key: 'gnubash', name: 'Bash', logo: '/images/tech/gnubash.svg' },
  { key: 'postgresql', name: 'PostgreSQL', logo: '/images/tech/postgresql.svg' },
  { key: 'sqlite', name: 'SQLite', logo: '/images/tech/sqlite.svg' },
  { key: 'tensorflow', name: 'TensorFlow', logo: '/images/tech/tensorflow.svg' },
  { key: 'pytorch', name: 'PyTorch', logo: '/images/tech/pytorch.svg' },
  { key: 'huggingface', name: 'Hugging Face', logo: '/images/tech/huggingface.svg' },
  { key: 'modelcontextprotocol', name: 'Model Context Protocol', logo: '/images/tech/modelcontextprotocol.svg' },
  { key: 'perplexity', name: 'Perplexity', logo: '/images/tech/perplexity.svg' },
  { key: 'rstudioide', name: 'RStudio', logo: '/images/tech/rstudioide.svg' },
  { key: 'github', name: 'GitHub', logo: '/images/tech/github.svg' },
  { key: 'codechef', name: 'CodeChef', logo: '/images/tech/codechef.svg' },
]
