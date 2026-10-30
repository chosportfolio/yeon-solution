import { fileURLToPath } from 'node:url';

const entries = [
  ['seoul-station', '서울역', '서울역.jpg', '냉난방기'],
  ['yongsan-station', '용산역', '용산역.jpg', '칠러'],
  ['hongdae-station', '홍대입구역', '홍대입구역.jpg', '온수시스템'],
  ['seocheon-school', '용인 서천초등학교', '용인 서천초등학교.jpeg', '냉난방기'],
  ['saebit-school', '용신 새빛초등학교', '용신 새빛초등학교.png', '냉난방기'],
  ['donga-cheongju', '동원오츠카 청주', '동원오츠카 청주.png', '칠러'],
];

export const seedMedia = new Map(entries.map(([id, , filename]) => [
  `${id}.${filename.endsWith('.png') ? 'png' : 'jpg'}`,
  fileURLToPath(new URL(`../src/assets/construction location/${filename}`, import.meta.url)),
]));

export const seedProjects = entries.map(([id, name, filename, category]) => {
  const image = `/api/media/${id}.${filename.endsWith('.png') ? 'png' : 'jpg'}`;
  return { id, name, category, image, blocks: [{ id: `${id}-photo`, type: 'image', image, caption: name }], createdAt: '', updatedAt: '' };
});
