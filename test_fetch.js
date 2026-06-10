// test_fetch.js
import { supabase } from './lib/supabase';

async function run() {
  const { data: cats, error: catErr } = await supabase.from('categories').select('*');
  console.log('Categories:', cats, 'Error:', catErr);

  const { data: items, error: itemErr } = await supabase.from('menu_items').select('*');
  console.log('Menu Items:', items, 'Error:', itemErr);
}
run();
