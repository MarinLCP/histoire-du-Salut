// Lit un fichier ZIP qui contient un seul fichier (cross-references.zip), sans dépendance :
// zlib (fourni avec Node) sait décompresser, il suffit de trouver où sont les données.
// Un ZIP se lit par la fin : l'« annuaire » (central directory) dit où commence chaque fichier.
// Les décalages ci-dessous (en octets) viennent de la spécification du format ZIP (APPNOTE de PKWARE).

import { inflateRawSync } from 'node:zlib';

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const DEFLATE = 8;
const NOT_A_ZIP = 'Ce fichier n\'est pas un ZIP lisible.';

// Dans le bloc de fin : où commence l'annuaire
const DIRECTORY_START = 16;
// Dans une entrée de l'annuaire : méthode de compression, taille compressée, début du fichier
const COMPRESSION_METHOD = 10;
const COMPRESSED_SIZE = 20;
const LOCAL_HEADER_START = 42;
// Dans l'en-tête du fichier : longueur du nom et du champ « extra », puis les données (après 30 octets fixes)
const LOCAL_NAME_LENGTH = 26;
const LOCAL_EXTRA_LENGTH = 28;
const LOCAL_FIXED_SIZE = 30;

// buffer : le contenu du fichier ZIP. Renvoie le texte du fichier compressé (UTF-8).
export function readSingleFileZip(buffer) {
  const entry = firstDirectoryEntry(buffer);
  const header = entry.localOffset;
  const dataStart = header + LOCAL_FIXED_SIZE
    + buffer.readUInt16LE(header + LOCAL_NAME_LENGTH) + buffer.readUInt16LE(header + LOCAL_EXTRA_LENGTH);
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  return inflateRawSync(compressed).toString('utf8');
}

// L'annuaire est annoncé par un petit bloc tout à la fin du fichier (on le cherche en partant de la fin)
function firstDirectoryEntry(buffer) {
  const end = buffer.lastIndexOf(signature(END_OF_DIRECTORY));
  if (end === -1) throw new Error(NOT_A_ZIP);
  const directory = buffer.readUInt32LE(end + DIRECTORY_START);
  expectSignature(buffer, directory, DIRECTORY_ENTRY);
  if (buffer.readUInt16LE(directory + COMPRESSION_METHOD) !== DEFLATE) throw new Error('Compression du ZIP non prise en charge.');

  const localOffset = buffer.readUInt32LE(directory + LOCAL_HEADER_START);
  expectSignature(buffer, localOffset, LOCAL_HEADER);
  return { compressedSize: buffer.readUInt32LE(directory + COMPRESSED_SIZE), localOffset };
}

function expectSignature(buffer, offset, value) {
  if (buffer.readUInt32LE(offset) !== value) throw new Error(NOT_A_ZIP);
}

function signature(value) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}
