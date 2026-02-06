const supabase = require('../utils/supabaseClient'); // Importa el cliente de Supabase
const { v4: uuidv4 } = require('uuid'); // Para generar nombres de archivo únicos

// Asegúrate de instalar 'uuid' si aún no lo tienes: npm install uuid

const BUCKET_NAME = 'incidencia-fotos'; // El nombre de tu bucket en Supabase
const FOLDER_PATH = 'public'; // La subcarpeta dentro del bucket, según tu política RLS

async function uploadImage(fileBuffer, originalFileName) {
  try {
    // Generar un nombre de archivo único usando UUID y la extensión original
    const fileExtension = originalFileName.split('.').pop();
    if (fileExtension.toLowerCase() !== 'jpg') {
      throw new Error('Solo se permiten archivos JPG según la política RLS.');
    }
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${FOLDER_PATH}/${uniqueFileName}`;

    // Subir el archivo a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600', // 1 hora de caché
        upsert: false, // No sobrescribir si ya existe
        contentType: `image/${fileExtension}` // Asegura el tipo de contenido correcto
      });

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError);
      throw new Error('Fallo al subir la imagen.');
    }

    // Obtener la URL pública del archivo subido
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen.');
    }

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Error en supabaseUploadService.uploadImage:', error.message);
    throw error;
  }
}

module.exports = {
  uploadImage,
};
