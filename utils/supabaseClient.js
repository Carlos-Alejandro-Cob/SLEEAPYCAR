const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Carga las variables de entorno desde .env

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos la service_role key para el backend

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos en .env');
  process.exit(1); // Termina la aplicación si las credenciales no están configuradas
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
