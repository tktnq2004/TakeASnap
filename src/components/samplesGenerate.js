const fs = require("fs");
const path = require("path");

const BASE_DIR = path.resolve(__dirname, "../assets/images");
const OUT_FILE = path.resolve(__dirname, "../components/sampleImages.ts");

// Chỉ lấy các folder category
const categories = fs.readdirSync(BASE_DIR).filter(name => {
  const full = path.join(BASE_DIR, name);
  return fs.statSync(full).isDirectory();
});

let output = `
export type SampleImage = {
  id: string;
  source: any;
};

export type SampleCategory = {
  id: string;
  title: string;
  images: SampleImage[];
};

export const SAMPLE_CATEGORIES: SampleCategory[] = [
`;

categories.forEach(cat => {
  const dir = path.join(BASE_DIR, cat);
  const files = fs
    .readdirSync(dir)
    .filter(f => /\.(png|jpe?g)$/i.test(f));

  if (files.length === 0) return;

  output += `
  {
    id: "${cat}",
    title: "${cat}",
    images: [
`;

  files.forEach(file => {
    output += `
      {
        id: "${cat}-${file}",
        source: require("../assets/images/${cat}/${file}"),
      },
`;
  });

  output += `
    ],
  },
`;
});

output += `
];
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, output);

console.log("✓ sampleImages.ts generated");
