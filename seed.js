const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local file
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: 'Breakfast', icon: '🍳', sort_order: 1 },
  { name: 'Lunch', icon: '🍛', sort_order: 2 },
  { name: 'Evening Snacks', icon: '🥪', sort_order: 3 },
  { name: 'Beverages & Desserts', icon: '🥤', sort_order: 4 }
];

const menuItems = {
  'Breakfast': [
    { name: 'Bread Pakoda', price_min: 20, description: 'Crispy bread pakoda with spiced potato filling' },
    { name: 'Vegetable Cheela', price_min: 40, description: 'Healthy and tasty chickpea flour pancakes loaded with veggies' },
    { name: 'Burger', price_min: 55, description: 'Homemade veg burger with fresh patty and veggies' },
    { name: 'Poha', price_min: 60, description: 'Light and fluffy flattened rice seasoned with mustard seeds and curry leaves' },
    { name: 'Triangle Sandwich', price_min: 60, description: 'Classic grilled sandwich with green chutney and veggies' },
    { name: 'Corn Sandwich', price_min: 70, description: 'Creamy corn and cheese filling grilled to perfection' },
    { name: 'Aloo Puri', price_min: 80, description: 'Hot puris served with delicious spicy potato curry' },
    { name: 'Paneer Sandwich', price_min: 90, description: 'Grilled sandwich stuffed with spiced paneer crumble' },
    { name: 'Corn Paratha Combo (2 Paratha + Curd + Achar)', price_min: 80, description: 'Two delicious corn-stuffed parathas served with curd and pickle' },
    { name: 'Aloo Pyaz Paratha Combo (2 Paratha + Curd + Achar)', price_min: 80, description: 'Two spiced potato and onion parathas served with curd and pickle' },
    { name: 'Aloo Paratha Combo (2 Paratha + Curd + Achar)', price_min: 90, description: 'Two traditional spiced potato parathas served with curd and pickle' },
    { name: 'Pasta', price_min: 120, description: 'Creamy homemade pasta with fresh veggies and herbs' },
    { name: 'Paneer Paratha Combo (2 Paratha + Curd + Achar)', price_min: 120, description: 'Two rich paneer-stuffed parathas served with curd and pickle' },
    { name: 'Paneer Bread Pakoda', price_min: 35, description: 'Bread pakoda with a thick slice of spiced paneer' }
  ],
  'Lunch': [
    { name: 'Dal Fry Rice Combo', price_min: 99, description: 'Yellow dal fry served with steamed basmati rice' },
    { name: 'Aloo Gobhi with 2 Roti, Salad & Raita', price_min: 99, description: 'Homestyle potato & cauliflower sabzi served with 2 rotis, salad, and raita' },
    { name: 'Chole Rice Combo', price_min: 99, description: 'Spicy Delhi-style chole served with steamed basmati rice' },
    { name: 'Rajma Rice Combo', price_min: 99, description: 'Rich and creamy rajma cooked in home spices, served with basmati rice' },
    { name: 'Mix Veg Rice Combo', price_min: 99, description: 'Seasonal mixed vegetables served with steamed basmati rice' },
    { name: 'Veg Pulao with Curd', price_min: 99, description: 'Aromatic basmati rice cooked with fresh veggies, served with chilled curd' },
    { name: 'Dal Makhani Rice Combo', price_min: 99, description: 'Slow-cooked creamy dal makhani served with basmati rice' },
    { name: 'Dal Makhani', price_min: 120, description: 'Rich, slow-cooked black lentils in butter and cream (Single portion)' },
    { name: 'Paneer Bhurji', price_min: 170, description: 'Scrambled paneer cooked with onions, tomatoes, and home spices' },
    { name: 'Paneer Butter Masala', price_min: 180, description: 'Soft paneer cubes in a rich, creamy, and mildly sweet tomato gravy' },
    { name: 'Kadai Paneer', price_min: 180, description: 'Paneer cooked with bell peppers and freshly ground kadai spices' },
    { name: 'Full Combo (Dal Fry/Dal Makhani + Rice + Raita + 2 Roti + Salad)', price_min: 160, price_max: 180, description: 'Complete meal with your choice of Dal, rice, raita, 2 rotis, and fresh salad' },
    { name: 'Paneer Combo Meal (Paneer Bhurji/Paneer Curry + Raita + 2 Roti + Salad)', price_min: 200, price_max: 220, description: 'Premium meal featuring your choice of paneer dish, raita, 2 rotis, and fresh salad' }
  ],
  'Evening Snacks': [
    { name: 'Bread Pakoda', price_min: 20, description: 'Crispy bread pakoda with potato filling' },
    { name: 'Vegetable Cheela', price_min: 40, description: 'Healthy gram flour pancakes with finely chopped veggies' },
    { name: 'Burger', price_min: 55, description: 'Homemade veg burger patty with fresh dressing' },
    { name: 'Triangle Sandwich', price_min: 60, description: 'Classic green chutney grilled sandwich' },
    { name: 'Poha', price_min: 60, description: 'Light flattened rice seasoned with peanuts and spices' },
    { name: 'Corn Sandwich', price_min: 70, description: 'Sweet corn and melted cheese grilled sandwich' },
    { name: 'Paneer Sandwich', price_min: 90, description: 'Grilled sandwich with spiced paneer filling' },
    { name: 'Pasta', price_min: 120, description: 'Penne pasta in a rich, creamy red or white sauce' },
    { name: 'Mix Pakode', price_min: 80, description: 'Assorted hot and crispy vegetable fritters' },
    { name: 'Paneer Pakoda', price_min: 25, description: 'Crispy gram-flour coated fried paneer fritter (per pc)' },
    { name: 'Paneer Bread Pakoda', price_min: 35, description: 'Bread pakoda stuffed with potato and paneer slice' }
  ],
  'Beverages & Desserts': [
    { name: 'Virgin Mojito', price_min: 70, description: 'Refreshing summer drink with mint, lemon, and soda' },
    { name: 'Lime Soda', price_min: 50, description: 'Sweet and salted lime soda' },
    { name: 'Cold Coffee', price_min: 89, description: 'Creamy, frothy iced coffee' },
    { name: 'Kheer', price_min: 49, description: 'Traditional Indian sweet rice pudding flavored with cardamom' },
    { name: 'Sooji Halwa', price_min: 35, description: 'Sweet and rich semolina pudding made with pure ghee' },
    { name: 'Brownie', price_min: 35, description: 'Fudgy and rich chocolate brownie' }
  ]
};

async function seed() {
  console.log('Starting seed process...');

  try {
    // 1. Delete existing items to avoid duplicates
    console.log('Clearing old data...');
    await supabase.from('menu_items').delete().neq('id', 0);
    await supabase.from('categories').delete().neq('id', 0);

    // 2. Insert Categories
    console.log('Inserting categories...');
    const { data: insertedCategories, error: catError } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (catError) {
      throw catError;
    }

    console.log(`Successfully inserted ${insertedCategories.length} categories.`);

    // Map category names to IDs
    const categoryMap = {};
    insertedCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // 3. Prepare Menu Items
    const itemsToInsert = [];
    for (const [catName, items] of Object.entries(menuItems)) {
      const categoryId = categoryMap[catName];
      if (!categoryId) {
        console.warn(`Category "${catName}" not found in inserted categories map!`);
        continue;
      }
      items.forEach(item => {
        itemsToInsert.push({
          category_id: categoryId,
          name: item.name,
          price_min: item.price_min,
          price_max: item.price_max || null,
          description: item.description,
          is_available: true,
          is_featured: false
        });
      });
    }

    // 4. Insert Menu Items
    console.log(`Inserting ${itemsToInsert.length} menu items...`);
    const { data: insertedItems, error: itemsError } = await supabase
      .from('menu_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      throw itemsError;
    }

    console.log(`Successfully inserted ${insertedItems.length} menu items!`);
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err.message || err);
  }
}

seed();
