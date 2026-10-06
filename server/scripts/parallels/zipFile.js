// Lit un fichier ZIP qui contient un seul fichier (cross-references.zip), sans dépendance :
// zlib (fourni avec Node) sait décompresser, il suffit de trouver où sont les données.
// Un ZIP se lit par la fin : l'« annuaire » (central directory) dit où commence chaque fichier.

import { inflateRawSync } from 'node:zlib';

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const DEFLATE = 8;

// buffer : le contenu du fichier ZIP. Renvoie { name, text } (texte en UTF-8).
export function readSingleFileZip(buffer) {
  const entry = firstDirectoryEntry(buffer);
  const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
  const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
  const dataStart = entry.localOffset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  return { name: entry.name, text: inflateRawSync(compressed).toString('utf8') };
}

// L'annuaire est annoncé par un petit bloc tout à la fin du fichier (on le cherche en partant de la fin)
function firstDirectoryEntry(buffer) {
  const end = buffer.lastIndexOf(signature(END_OF_DIRECTORY));
  if (end === -1) throw new Error('Ce fichier n\'est pas un ZIP lisible.');
  const directory = buffer.readUInt32LE(end + 16);
  if (buffer.readUInt32LE(directory) !== DIRECTORY_ENTRY) throw new Error('Ce fichier n\'est pas un ZIP lisible.');
  if (buffer.readUInt16LE(directory + 10) !== DEFLATE) throw new Error('Compression du ZIP non prise en charge.');

  const nameLength = buffer.readUInt16LE(directory + 28);
  const localOffset = buffer.readUInt32LE(directory + 42);
  if (buffer.readUInt32LE(localOffset) !== LOCAL_HEADER) throw new Error('Ce fichier n\'est pas un ZIP lisible.');
  return {
    name: buffer.toString('utf8', directory + 46, directory + 46 + nameLength),
    compressedSize: buffer.readUInt32LE(directory + 20),
    localOffset,
  };
}

function signature(value) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes;
}
