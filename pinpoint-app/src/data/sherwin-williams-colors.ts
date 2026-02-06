// Sherwin-Williams Color Database
// Top 200+ most popular Sherwin-Williams paint colors
// with accurate hex values, RGB, and color family classification

export type ColorFamily =
  | 'white'
  | 'neutral'
  | 'black'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple';

export interface SWColor {
  name: string;
  code: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  family: ColorFamily;
}

export const COLOR_FAMILIES: { key: ColorFamily; label: string; emoji: string }[] = [
  { key: 'white', label: 'White', emoji: '⬜' },
  { key: 'neutral', label: 'Neutral', emoji: '🔘' },
  { key: 'black', label: 'Black', emoji: '⬛' },
  { key: 'red', label: 'Red', emoji: '🔴' },
  { key: 'orange', label: 'Orange', emoji: '🟠' },
  { key: 'yellow', label: 'Yellow', emoji: '🟡' },
  { key: 'green', label: 'Green', emoji: '🟢' },
  { key: 'blue', label: 'Blue', emoji: '🔵' },
  { key: 'purple', label: 'Purple', emoji: '🟣' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function c(name: string, code: string, hex: string, family: ColorFamily): SWColor {
  return { name, code, hex, rgb: hexToRgb(hex), family };
}

export const SHERWIN_WILLIAMS_COLORS: SWColor[] = [
  // ─── WHITES ────────────────────────────────────────
  c('Alabaster', 'SW 7008', '#EDEAE0', 'white'),
  c('Pure White', 'SW 7005', '#EDECE1', 'white'),
  c('Extra White', 'SW 7006', '#ECEAE2', 'white'),
  c('Snowbound', 'SW 7004', '#EDEBE2', 'white'),
  c('Dover White', 'SW 6385', '#E3DABD', 'white'),
  c('Greek Villa', 'SW 7551', '#F0E6D4', 'white'),
  c('Shoji White', 'SW 7042', '#E6DFCF', 'white'),
  c('Creamy', 'SW 7012', '#EFE1C6', 'white'),
  c('Natural Choice', 'SW 7011', '#E4DACA', 'white'),
  c('Westhighland White', 'SW 7566', '#F0E8D4', 'white'),
  c('Shell White', 'SW 8917', '#EDE8DD', 'white'),
  c('White Flour', 'SW 7102', '#EBE3D5', 'white'),
  c('Marshmallow', 'SW 7001', '#EDE9DF', 'white'),
  c('Pearly White', 'SW 7009', '#E8E0D0', 'white'),
  c('Ivory Lace', 'SW 7013', '#EDE0C8', 'white'),
  c('Eider White', 'SW 7014', '#E3DDD6', 'white'),
  c('White Duck', 'SW 7010', '#E2D8C2', 'white'),
  c('Aesthetic White', 'SW 7035', '#E7DCC8', 'white'),
  c('China White', 'SW 0049', '#EDE8DC', 'white'),
  c('Moderate White', 'SW 6140', '#E7E0D3', 'white'),
  c('White Heron', 'SW 7627', '#ECE7DE', 'white'),
  c('Incredible White', 'SW 7028', '#EDE7D9', 'white'),
  c('First Star', 'SW 7646', '#E2DDD5', 'white'),

  // ─── NEUTRALS / GRAYS / BEIGES / GREIGES ──────────
  c('Agreeable Gray', 'SW 7029', '#D1CAB8', 'neutral'),
  c('Accessible Beige', 'SW 7036', '#D1C4AD', 'neutral'),
  c('Repose Gray', 'SW 7015', '#C2BDB3', 'neutral'),
  c('Worldly Gray', 'SW 7043', '#BCB6A6', 'neutral'),
  c('Mindful Gray', 'SW 7016', '#B3AFA4', 'neutral'),
  c('Revere Pewter', 'SW 0050', '#C4B9A3', 'neutral'),
  c('Balanced Beige', 'SW 7037', '#BBAD95', 'neutral'),
  c('Mega Greige', 'SW 7031', '#B0A68E', 'neutral'),
  c('Analytical Gray', 'SW 7051', '#B5AFA0', 'neutral'),
  c('Perfect Greige', 'SW 6073', '#BAA993', 'neutral'),
  c('Colonnade Gray', 'SW 7641', '#BBB5A3', 'neutral'),
  c('Amazing Gray', 'SW 7044', '#A8A296', 'neutral'),
  c('Anew Gray', 'SW 7030', '#BAB1A2', 'neutral'),
  c('Pewter Tankard', 'SW 0023', '#9B9589', 'neutral'),
  c('Silverpointe', 'SW 7653', '#C2BEB5', 'neutral'),
  c('Passive', 'SW 7064', '#BFC0BA', 'neutral'),
  c('Gray Matters', 'SW 7066', '#A8A89E', 'neutral'),
  c('Dorian Gray', 'SW 7017', '#A1998E', 'neutral'),
  c('Tony Taupe', 'SW 7038', '#A5957F', 'neutral'),
  c('Functional Gray', 'SW 7024', '#ABA79E', 'neutral'),
  c('Requisite Gray', 'SW 7023', '#B1AB9D', 'neutral'),
  c('Useful Gray', 'SW 7050', '#B1AA97', 'neutral'),
  c('Pavestone', 'SW 7642', '#9C968A', 'neutral'),
  c('Gossamer Veil', 'SW 9165', '#D5CCBB', 'neutral'),
  c('Zurich White', 'SW 7626', '#D5CEC4', 'neutral'),
  c('Modern Gray', 'SW 7632', '#CACBC3', 'neutral'),
  c('Versatile Gray', 'SW 6072', '#C2B49B', 'neutral'),
  c('Intellectual Gray', 'SW 7045', '#A09E96', 'neutral'),
  c('Keystone Gray', 'SW 7504', '#9C978B', 'neutral'),
  c('Proper Gray', 'SW 6003', '#AFA99B', 'neutral'),
  c('Gauntlet Gray', 'SW 7019', '#7A756D', 'neutral'),
  c('Anonymous', 'SW 7046', '#918E85', 'neutral'),
  c('Pussywillow', 'SW 7643', '#908B7D', 'neutral'),
  c('Argos', 'SW 7065', '#979891', 'neutral'),
  c('Warm Stone', 'SW 7032', '#A49B8A', 'neutral'),
  c('Temperate Taupe', 'SW 6037', '#B5A58C', 'neutral'),
  c('Virtual Taupe', 'SW 7039', '#9B8E7A', 'neutral'),
  c('Downing Sand', 'SW 2822', '#C8AE8A', 'neutral'),
  c('Sand Dune', 'SW 6086', '#C1A07C', 'neutral'),
  c('Sanderling', 'SW 7513', '#C1AC8B', 'neutral'),
  c('Loggia', 'SW 7506', '#B9A684', 'neutral'),
  c('Latte', 'SW 6108', '#C1A27C', 'neutral'),
  c('Nomadic Desert', 'SW 6107', '#C8A67D', 'neutral'),
  c('Kilim Beige', 'SW 6106', '#C6A987', 'neutral'),

  // ─── BLACKS & DARK NEUTRALS ────────────────────────
  c('Tricorn Black', 'SW 6258', '#2E2D2B', 'black'),
  c('Iron Ore', 'SW 7069', '#4B4744', 'black'),
  c('Black Magic', 'SW 6991', '#2C2C2E', 'black'),
  c('Caviar', 'SW 6990', '#37353A', 'black'),
  c('Urbane Bronze', 'SW 7048', '#54504A', 'black'),
  c('Peppercorn', 'SW 7674', '#585451', 'black'),
  c('Black Fox', 'SW 7020', '#4E463B', 'black'),
  c('Inkwell', 'SW 6992', '#31363B', 'black'),
  c('Greenblack', 'SW 6994', '#2E3632', 'black'),
  c('Charcoal Blue', 'SW 2739', '#3A444A', 'black'),
  c('Domino', 'SW 6989', '#3F3432', 'black'),
  c('Rock Bottom', 'SW 7062', '#5A5551', 'black'),
  c('Thunder Gray', 'SW 7645', '#6A6662', 'black'),
  c('Grizzle Gray', 'SW 7068', '#6D6A65', 'black'),

  // ─── REDS ──────────────────────────────────────────
  c('Redend Point', 'SW 9081', '#C4A18E', 'red'),
  c('Rojo Dust', 'SW 9006', '#A8533D', 'red'),
  c('Poinsettia', 'SW 6594', '#8C292A', 'red'),
  c('Red Bay', 'SW 6321', '#8B3332', 'red'),
  c('Fireweed', 'SW 6328', '#7B2E2E', 'red'),
  c('Bolero', 'SW 7600', '#A2544A', 'red'),
  c('Toile Red', 'SW 0006', '#8B3838', 'red'),
  c('Cochineal', 'SW 9084', '#A83E3D', 'red'),
  c('Vermilion', 'SW 2914', '#984B3C', 'red'),
  c('Coral Rose', 'SW 9004', '#C98074', 'red'),
  c('Rosedust', 'SW 0025', '#B38A7C', 'red'),
  c('Resounding Rose', 'SW 6318', '#BE7E79', 'red'),
  c('Blushing', 'SW 6617', '#D8A7A1', 'red'),
  c('Rachel Pink', 'SW 0026', '#D8AE9A', 'red'),
  c('Mellow Coral', 'SW 6324', '#D09E8B', 'red'),
  c('Smoky Salmon', 'SW 6331', '#C8968E', 'red'),
  c('Roycroft Rose', 'SW 0034', '#C1847F', 'red'),
  c('Chrysanthemum', 'SW 6347', '#C33B2B', 'red'),

  // ─── ORANGES ───────────────────────────────────────
  c('Cavern Clay', 'SW 7701', '#B4704F', 'orange'),
  c('Persimmon', 'SW 6339', '#C76A3D', 'orange'),
  c('Copper Wire', 'SW 7707', '#9C6F50', 'orange'),
  c('Determined Orange', 'SW 6635', '#CE6F3E', 'orange'),
  c('Invigorate', 'SW 6886', '#C4603E', 'orange'),
  c('Emberglow', 'SW 6627', '#C2613E', 'orange'),
  c('Robust Orange', 'SW 6628', '#B8543A', 'orange'),
  c('Armagnac', 'SW 6354', '#AB7756', 'orange'),
  c('Brandywine', 'SW 7710', '#9C644C', 'orange'),
  c('Rustic Adobe', 'SW 7708', '#8B5E46', 'orange'),
  c('Smoky Topaz', 'SW 6117', '#B99476', 'orange'),
  c('Folksy Gold', 'SW 6360', '#C69452', 'orange'),
  c('Copper Mountain', 'SW 6356', '#A27050', 'orange'),
  c('Spiced Cider', 'SW 7702', '#C08559', 'orange'),
  c('Rhumba Orange', 'SW 6642', '#D3793A', 'orange'),
  c('Tanager', 'SW 6601', '#CE502B', 'orange'),
  c('Obstinate Orange', 'SW 6884', '#C85636', 'orange'),
  c('Subdued Sienna', 'SW 9009', '#A06E56', 'orange'),

  // ─── YELLOWS ───────────────────────────────────────
  c('Butter Up', 'SW 6681', '#F0CE6C', 'yellow'),
  c('Jersey Cream', 'SW 6379', '#E9D29E', 'yellow'),
  c('Ivoire', 'SW 6127', '#E4CFA1', 'yellow'),
  c('Chamois', 'SW 6131', '#D7BC82', 'yellow'),
  c('Banana Cream', 'SW 6673', '#ECD38F', 'yellow'),
  c('Friendly Yellow', 'SW 6680', '#EEC85C', 'yellow'),
  c('Anjou Pear', 'SW 6381', '#D0BC72', 'yellow'),
  c('Sunflower', 'SW 6678', '#DFAA3C', 'yellow'),
  c('Afternoon', 'SW 6675', '#E4C36A', 'yellow'),
  c('Bee', 'SW 6683', '#D9A43E', 'yellow'),
  c('Polished Gold', 'SW 6737', '#B59038', 'yellow'),
  c('Gambol Gold', 'SW 6690', '#D7AA44', 'yellow'),
  c('Brittlebush', 'SW 6684', '#D9B24C', 'yellow'),
  c('Crispy Gold', 'SW 6691', '#C69638', 'yellow'),
  c('Cut the Mustard', 'SW 6384', '#C4A34E', 'yellow'),
  c('Saucy Gold', 'SW 6370', '#C5A153', 'yellow'),
  c('Overjoy', 'SW 6689', '#D9B658', 'yellow'),
  c('Venetian Yellow', 'SW 1666', '#E6D27E', 'yellow'),

  // ─── GREENS ────────────────────────────────────────
  c('Evergreen Fog', 'SW 9130', '#95978A', 'green'),
  c('Pewter Green', 'SW 6208', '#8C9084', 'green'),
  c('Sage', 'SW 2860', '#92946E', 'green'),
  c('Dried Thyme', 'SW 6186', '#7D8166', 'green'),
  c('Retreat', 'SW 6207', '#677265', 'green'),
  c('Basil', 'SW 6194', '#5E6B52', 'green'),
  c('Clary Sage', 'SW 6178', '#9A9B82', 'green'),
  c('Rookwood Jade', 'SW 2812', '#687565', 'green'),
  c('Cascade Green', 'SW 0066', '#7DA49B', 'green'),
  c('Privilege Green', 'SW 6193', '#6A7B5E', 'green'),
  c('Rosemary', 'SW 6187', '#6D7550', 'green'),
  c('Gallery Green', 'SW 0015', '#587566', 'green'),
  c('Ripe Olive', 'SW 6209', '#575541', 'green'),
  c('Acacia Haze', 'SW 9132', '#97998B', 'green'),
  c('Jasper', 'SW 6216', '#3E6960', 'green'),
  c('Isle of Pines', 'SW 6461', '#395941', 'green'),
  c('Vogue Green', 'SW 0065', '#4D7A6E', 'green'),
  c('Relentless Olive', 'SW 6425', '#8E9455', 'green'),
  c('Reclining Green', 'SW 6744', '#7BAA70', 'green'),
  c('Nurture Green', 'SW 6451', '#678874', 'green'),
  c('Supreme Green', 'SW 6442', '#6E9B7D', 'green'),
  c('Alexandrite', 'SW 0060', '#598381', 'green'),
  c('Billiard Green', 'SW 0016', '#4A695E', 'green'),
  c('Oakmoss', 'SW 6180', '#6C6D52', 'green'),

  // ─── BLUES ─────────────────────────────────────────
  c('Naval', 'SW 6244', '#2E3441', 'blue'),
  c('Indigo Batik', 'SW 7602', '#3D4E64', 'blue'),
  c('Gale Force', 'SW 7605', '#3C5163', 'blue'),
  c('In the Navy', 'SW 9178', '#2B3851', 'blue'),
  c('Waterloo', 'SW 9141', '#8492A0', 'blue'),
  c('Smoky Blue', 'SW 7604', '#697D8E', 'blue'),
  c('Distance', 'SW 6243', '#5D6E80', 'blue'),
  c('Bracing Blue', 'SW 6242', '#4E6074', 'blue'),
  c('Sea Salt', 'SW 6204', '#C2CEBD', 'green'),
  c('Tradewind', 'SW 6218', '#8BAAA8', 'blue'),
  c('Rain', 'SW 6219', '#87AEB0', 'blue'),
  c('Rainstorm', 'SW 6230', '#3B5B67', 'blue'),
  c('Still Water', 'SW 6223', '#4A6D72', 'blue'),
  c('Refuge', 'SW 6228', '#58797B', 'blue'),
  c('Watery', 'SW 6478', '#B4D6D4', 'blue'),
  c('Tidewater', 'SW 6477', '#8CC0BC', 'blue'),
  c('Denim', 'SW 6523', '#5E97B3', 'blue'),
  c('Santorini Blue', 'SW 7607', '#5C7C8A', 'blue'),
  c('Debonair', 'SW 9139', '#688A9D', 'blue'),
  c('Resolute Blue', 'SW 6507', '#3E6D84', 'blue'),
  c('Georgian Bay', 'SW 6509', '#295F79', 'blue'),
  c('Celestial', 'SW 6808', '#A3C4CA', 'blue'),
  c('Copen Blue', 'SW 0068', '#7CABB4', 'blue'),
  c('Poolhouse', 'SW 7603', '#6B8EA1', 'blue'),
  c('Storm Cloud', 'SW 6249', '#5A6A71', 'blue'),
  c('Endless Sea', 'SW 9150', '#304C5E', 'blue'),
  c('Commodore', 'SW 6524', '#4D8BAD', 'blue'),
  c('Moody Blue', 'SW 6221', '#677F8A', 'blue'),
  c('Stardew', 'SW 9138', '#A9B8C0', 'blue'),
  c('Windy Blue', 'SW 6240', '#7D95A8', 'blue'),
  c('Sleepy Blue', 'SW 6225', '#ADC7CE', 'blue'),

  // ─── PURPLES ───────────────────────────────────────
  c('Expressive Plum', 'SW 6271', '#5D4C5C', 'purple'),
  c('Quixotic Plum', 'SW 6265', '#8C7385', 'purple'),
  c('Mature Grape', 'SW 6286', '#493B4F', 'purple'),
  c('Plummy', 'SW 6558', '#675067', 'purple'),
  c('Grape Harvest', 'SW 6285', '#6F5E72', 'purple'),
  c('Exclusive Plum', 'SW 6263', '#7B6C82', 'purple'),
  c('Fashionable Gray', 'SW 6275', '#8A7F88', 'purple'),
  c('Mysterious Mauve', 'SW 6262', '#AB9FAE', 'purple'),
  c('Ash Violet', 'SW 6549', '#8B7F97', 'purple'),
  c('Immortal', 'SW 6576', '#7B6B8C', 'purple'),
  c('Veri Berri', 'SW 6581', '#796790', 'purple'),
  c('Vigorous Violet', 'SW 6838', '#7B609D', 'purple'),
  c('African Violet', 'SW 6982', '#835E8A', 'purple'),
  c('Lavender Wisp', 'SW 7021', '#DDD5D8', 'purple'),
  c('Beguiling Mauve', 'SW 6269', '#A08A9A', 'purple'),
  c('Radiant Lilac', 'SW 0074', '#C8ACCC', 'purple'),
  c('Novel Lilac', 'SW 6836', '#8F77A8', 'purple'),
  c('Euphoric Lilac', 'SW 6835', '#B9A3CA', 'purple'),
];

// Search helper
export function searchColors(
  query: string,
  family?: ColorFamily
): SWColor[] {
  let results = SHERWIN_WILLIAMS_COLORS;

  if (family) {
    results = results.filter((c) => c.family === family);
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    // Normalize: strip spaces and "sw" prefix for code matching
    // So "SW6204", "sw 6204", "6204" all match "SW 6204"
    const qNorm = q.replace(/\s+/g, '');
    results = results.filter((c) => {
      const codeNorm = c.code.toLowerCase().replace(/\s+/g, '');
      const codeNum = c.code.replace(/\D/g, '');
      return (
        c.name.toLowerCase().includes(q) ||
        codeNorm.includes(qNorm) ||
        codeNum === qNorm.replace(/\D/g, '') ||
        c.hex.toLowerCase().includes(q)
      );
    });
  }

  return results;
}

// Get count per family
export function getColorFamilyCounts(): Record<ColorFamily, number> {
  const counts = {} as Record<ColorFamily, number>;
  for (const fam of COLOR_FAMILIES) {
    counts[fam.key] = SHERWIN_WILLIAMS_COLORS.filter(
      (c) => c.family === fam.key
    ).length;
  }
  return counts;
}
