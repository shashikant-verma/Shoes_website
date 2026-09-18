const imageSets = [
  [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900'
  ],
  [
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900'
  ],
  [
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900',
    'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=900'
  ],
  [
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900'
  ],
  [
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=900',
    'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=900'
  ],
  [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900',
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900'
  ]
];

const menProducts = [
  ['Urban Relay', 'Sneakers', 2499, 3999, 'A clean low-top sneaker with a cushioned footbed for commutes, coffee runs, and everyday city wear.', 'Everyday comfort', 18, 4.6, 128],
  ['Street Flex', 'Sneakers', 2199, 3499, 'A flexible textile trainer with a light feel and dependable grip for busy days on the move.', 'Flexible outsole', 27, 4.4, 86],
  ['Core Trainer', 'Training Shoes', 3299, 4999, 'A stable training shoe with a supportive heel and responsive cushioning for gym sessions and circuits.', 'Stable heel support', 14, 4.7, 142],
  ['Motion Pro', 'Running Shoes', 4299, 6499, 'A responsive road runner built with breathable mesh and a smooth ride for daily miles.', 'Responsive cushioning', 11, 4.8, 217],
  ['Classic Court', 'Casual Shoes', 1999, 2999, 'A pared-back court-inspired sneaker that pairs easily with denim, chinos, and relaxed tailoring.', 'Padded collar', 32, 4.3, 64],
  ['Everyday Runner', 'Running Shoes', 2799, 4299, 'A comfortable daily runner with a soft landing and ventilated upper for morning walks and easy runs.', 'Breathable upper', 21, 4.5, 97],
  ['Metro Pace', 'Running Shoes', 3899, 5999, 'A lightweight pace shoe with a smooth transition and confident traction for urban routes.', 'Lightweight build', 9, 4.7, 154],
  ['Avenue Knit', 'Casual Shoes', 2399, 3799, 'A sock-like knit sneaker with gentle stretch and a clean silhouette for all-day city comfort.', 'Stretch knit upper', 24, 4.4, 73],
  ['Harbor Walk', 'Walking Shoes', 1899, 2799, 'A supportive walking shoe with a flexible sole and cushioned collar for long, comfortable strolls.', 'Cushioned collar', 36, 4.2, 51],
  ['Summit Trail', 'Sports Shoes', 3599, 5499, 'A rugged trail-ready shoe with a grippy outsole for weekend paths and changing ground.', 'All-terrain grip', 13, 4.6, 109],
  ['Altitude Shield', 'Sports Shoes', 3999, 5999, 'A protective outdoor trainer with a durable upper and secure lace fit for active weekends.', 'Durable upper', 8, 4.5, 68],
  ['Tempo Grid', 'Training Shoes', 2999, 4499, 'A versatile cross-training shoe with a grounded base for strength work, classes, and quick movement.', 'Grounded base', 19, 4.4, 88],
  ['Canvas Lane', 'Casual Shoes', 1499, 2299, 'A relaxed canvas lace-up with a soft lining and timeless shape for off-duty wardrobes.', 'Soft textile lining', 41, 4.1, 47],
  ['Heritage Derby', 'Formal Shoes', 4499, 6999, 'A refined derby with a polished finish and cushioned insole for office days and occasions.', 'Cushioned insole', 10, 4.7, 82],
  ['Parkside Loafer', 'Loafers', 3799, 5999, 'A sleek slip-on loafer with a flexible sole for polished weekday dressing without the stiffness.', 'Flexible sole', 16, 4.5, 61],
  ['Oak Chelsea', 'Boots', 5299, 7999, 'A clean Chelsea boot with elastic side panels and a durable sole for cooler-season styling.', 'Elastic side panels', 7, 4.6, 44],
  ['Ridge Hiker', 'Boots', 4899, 7499, 'A supportive hiker-inspired boot with a secure collar for weekend trails and everyday layering.', 'Secure ankle collar', 12, 4.3, 39],
  ['Northline Slip', 'Walking Shoes', 1699, 2599, 'An easy slip-on walking shoe with a flexible construction for travel and daily errands.', 'Easy slip-on fit', 29, 4.2, 58],
  ['Canvas Court', 'Sneakers', 2299, 3499, 'A fresh court sneaker with a clean rubber sole and comfortable everyday proportions.', 'Rubber cupsole', 22, 4.4, 76],
  ['Sprint Edge', 'Running Shoes', 3199, 4899, 'A streamlined running shoe with a breathable upper for tempo sessions and weekend races.', 'Breathable mesh', 15, 4.6, 121],
  ['Studio Form', 'Training Shoes', 2899, 4399, 'A flexible studio trainer designed for balanced movement through workouts and classes.', 'Flexible forefoot', 17, 4.3, 53],
  ['Mile Marker', 'Running Shoes', 3699, 5699, 'A cushioned daily trainer with a steady ride for building consistent weekly mileage.', 'Daily mileage comfort', 20, 4.7, 133],
  ['West End Moc', 'Loafers', 3399, 5299, 'A modern moccasin-inspired loafer with a soft upper for relaxed smart-casual dressing.', 'Soft upper', 13, 4.2, 42],
  ['Formline Oxford', 'Formal Shoes', 4999, 7499, 'A streamlined Oxford with a neat profile and supportive footbed for formal wardrobes.', 'Supportive footbed', 6, 4.8, 71]
];

const womenProducts = [
  ['Aura Runner', 'Running Shoes', 2799, 4299, 'A light everyday runner with soft cushioning and a breathable upper for walks and easy miles.', 'Soft cushioning', 23, 4.7, 184],
  ['Urban Muse', 'Sneakers', 2499, 3999, 'A polished lifestyle sneaker with a clean profile that moves from errands to weekend plans.', 'Padded footbed', 31, 4.6, 136],
  ['Flex Walk', 'Walking Shoes', 1899, 2899, 'A flexible walking shoe with a supportive heel and easy comfort for long days on your feet.', 'Supportive heel', 28, 4.4, 91],
  ['Motion Lite', 'Training Shoes', 2999, 4599, 'A light cross-training shoe with a secure fit for studio classes, strength work, and daily movement.', 'Secure lockdown', 16, 4.5, 108],
  ['Street Comfort', 'Casual Shoes', 2199, 3399, 'A soft casual sneaker with a flexible sole and understated styling for everyday outfits.', 'Flexible sole', 35, 4.3, 72],
  ['Active Flow', 'Sports Shoes', 3299, 4999, 'A supportive active shoe with breathable panels and a stable base for busy, active routines.', 'Stable base', 18, 4.6, 119],
  ['Luna Court', 'Sneakers', 1999, 3099, 'A court-inspired sneaker with a crisp upper and cushioned footbed for effortless daily styling.', 'Cushioned footbed', 26, 4.2, 57],
  ['Cloudline Knit', 'Casual Shoes', 2399, 3799, 'A lightweight knit sneaker with a soft stretch upper for comfortable all-day wear.', 'Stretch knit upper', 20, 4.5, 83],
  ['Rosewood Flat', 'Flats', 1799, 2699, 'A refined flat with a softly rounded toe and flexible sole for workdays and evenings out.', 'Flexible construction', 34, 4.3, 49],
  ['Mira Ballet', 'Flats', 1599, 2499, 'A simple ballet flat with a soft lining and easy profile for everyday polished comfort.', 'Soft lining', 38, 4.1, 37],
  ['Cedar Ankle', 'Boots', 4299, 6499, 'A versatile ankle boot with a clean shaft and dependable sole for transitional weather styling.', 'Comfort ankle collar', 12, 4.5, 65],
  ['Noir Chelsea', 'Boots', 4699, 6999, 'A sleek Chelsea boot with elastic panels and a softly cushioned insole for easy seasonal dressing.', 'Elastic side panels', 9, 4.6, 78],
  ['Vista Trainer', 'Training Shoes', 3099, 4799, 'A stable trainer with a flexible forefoot for classes, gym sessions, and active weekends.', 'Flexible forefoot', 15, 4.4, 88],
  ['Bloom Pace', 'Running Shoes', 3899, 5999, 'A responsive road runner with breathable mesh and a smooth ride for steady daily training.', 'Responsive ride', 11, 4.8, 201],
  ['Swift Petal', 'Running Shoes', 3499, 5299, 'A light running shoe with a comfortable upper and reliable grip for regular routes.', 'Reliable grip', 19, 4.6, 126],
  ['Meadow Slip', 'Walking Shoes', 1699, 2599, 'An easy slip-on walking style with gentle support for travel, errands, and relaxed days.', 'Easy slip-on fit', 27, 4.2, 46],
  ['Daisy Lane', 'Casual Shoes', 2099, 3199, 'A cheerful everyday sneaker with a clean shape and soft interior for easy styling.', 'Soft interior', 25, 4.3, 61],
  ['Sienna Loafer', 'Loafers', 3299, 4999, 'A modern loafer with a softly squared toe and flexible sole for elevated everyday looks.', 'Flexible sole', 14, 4.5, 74],
  ['Willow Penny', 'Loafers', 3599, 5499, 'A classic penny loafer with a comfortable footbed for office dressing and smart weekends.', 'Comfort footbed', 10, 4.4, 52],
  ['Harper Court', 'Sneakers', 2299, 3499, 'A clean low-top sneaker with subtle contrast details for daily outfits and city walks.', 'Padded collar', 30, 4.5, 96],
  ['Nova Studio', 'Training Shoes', 2899, 4399, 'A light studio trainer with balanced support for movement-led workouts and active commutes.', 'Balanced support', 21, 4.3, 69],
  ['Rosa Trail', 'Sports Shoes', 3799, 5799, 'A grippy outdoor shoe with a protective upper for weekend paths and changing surfaces.', 'Protective upper', 8, 4.6, 84],
  ['Velvet Step', 'Flats', 1899, 2899, 'A graceful flat with a soft lining and understated finish for work-to-evening versatility.', 'Soft lining', 17, 4.2, 41],
  ['SoleVibe Ease', 'Walking Shoes', 1999, 2999, 'A supportive everyday walker with a cushioned base for comfortable, steady movement.', 'Cushioned base', 33, 4.4, 63]
];

const accessories = [
  ['Everyday Carry Tote', 'Accessories', 1299, 1999, 'A clean, durable tote designed to carry daily essentials from commute to weekend.', 'Reinforced handles', 22, 4.3, 28],
  ['SoleVibe Travel Kit', 'Accessories', 899, 1499, 'A compact travel kit for keeping footwear essentials organized on the move.', 'Compact organization', 37, 4.2, 19]
];

const ozarkProducts = [
  ['Ozark Ridge Runner', 'Ozark', 3999, 5999, 'A rugged everyday outdoor runner with dependable grip and comfortable trail-inspired cushioning.', 'Trail-ready grip', 13, 4.6, 57],
  ['Ozark Field Boot', 'Ozark', 5499, 8499, 'A durable field boot with a supportive collar and sturdy outsole for outdoor weekends.', 'Sturdy outsole', 7, 4.5, 34]
];

const makeProduct = (entry, index, gender, collection) => {
  const [name, type, price, originalPrice, description, feature, stock, rating, reviewCount] = entry;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  const imageSet = imageSets[index % imageSets.length];
  const sizes = gender === 'women' ? ['4', '5', '6', '7', '8', '9'] : ['6', '7', '8', '9', '10', '11', '12'];
  const colors = ['Black', 'White', 'Grey', 'Navy', 'Beige', 'Red'].slice(index % 3, (index % 3) + 3);

  return {
    name: `SoleVibe ${name}`,
    slug,
    sku: `SV-${gender === 'women' ? 'W' : gender === 'men' ? 'M' : 'U'}-${String(index + 1).padStart(3, '0')}`,
    brand: 'SoleVibe',
    category: gender === 'men' || gender === 'women' ? gender : 'unisex',
    gender,
    productType: type,
    collectionName: collection,
    price,
    originalPrice,
    discount,
    description,
    image: imageSet[0],
    images: imageSet,
    sizes,
    colors,
    specifications: {
      weight: `${180 + ((index * 13) % 70)}g`,
      drop: `${3 + (index % 5)}mm`,
      energy: `+${10 + (index % 8)}%`,
      material: index % 2 === 0 ? 'Breathable mesh and synthetic' : 'Textile and synthetic upper',
      sole: index % 3 === 0 ? 'Rubber and EVA' : 'Flexible rubber',
      closure: type === 'Loafers' || type === 'Flats' ? 'Slip-on' : 'Lace-up',
      type,
      use: type.includes('Running') ? 'Running' : type.includes('Training') ? 'Training' : 'Everyday'
    },
    features: [feature, 'Breathable upper', 'Cushioned footbed', 'Durable outsole'],
    badge: index % 6 === 0 ? 'BEST SELLER' : index % 5 === 0 ? 'NEW ARRIVAL' : 'SOLE VIBE EDIT',
    badgeColor: index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'secondary' : 'tertiary',
    stock,
    featured: index < 6,
    isNew: index % 5 === 0,
    onSale: discount > 0,
    rating,
    reviewCount,
    status: 'active'
  };
};

const catalog = [
  ...menProducts.map((product, index) => makeProduct(product, index, 'men', 'Men')), 
  ...womenProducts.map((product, index) => makeProduct(product, index, 'women', 'Women')),
  ...accessories.map((product, index) => makeProduct(product, index, 'unisex', 'Accessories')),
  ...ozarkProducts.map((product, index) => makeProduct(product, index + 2, 'unisex', 'Ozark'))
];

module.exports = catalog;
