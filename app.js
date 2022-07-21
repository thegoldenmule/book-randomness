#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const pako = require('pako');

const compress = (text) => {
  const input = new TextEncoder().encode(text);
  return pako.deflate(input);
};

const main = ({ folder, }) => {
  // get a list of files, with absolute paths, in the folder
  const files = fs.readdirSync(folder).map((file) => `${folder}/${file}`);

  // read text of each file
  const texts = files.map(file => fs.readFileSync(file, 'utf8'));

  // for each text...
  const records = texts.map((text, i) => {
    const len = text.length;

    // generate a "random" string of the same length as the text
    const random = new Array(len).fill(0).map(() => Math.floor(Math.random() * 26).toString(36)).join('');

    const bufferLength = new TextEncoder().encode(text).length;
    const randomCompressedLength = compress(random).length;
    const compressedLength = compress(text).length;

    const randomCompressedRatio = randomCompressedLength / bufferLength;
    const compressedRatio = compressedLength / bufferLength;

    return {
      file: files[i],
      bufferLength: bufferLength,
      randomCompressedRatio,
      compressedRatio,
      spread: compressedRatio - randomCompressedRatio
    };
  });

  // sort by spread
  records.sort((a, b) => b.spread - a.spread);

  // print out the results as csv
  console.log(`filename,bufferLength,randomCompressedRatio,compressedRatio,spread`);
  for (const record of records) {
    const { file, bufferLength, randomCompressedRatio, compressedRatio, spread } = record;

    // get just the filename from the path
    const filename = path.basename(file);
    console.log(`${filename},${bufferLength},${randomCompressedRatio},${compressedRatio},${spread}`);
  }
};

const options = [
  { name: 'help', alias: 'h', type: Boolean, },
  { name: 'folder', alias: 'f', type: String, },
];

const opts = commandLineArgs(options);

if (opts.help || !opts.folder) {
  const version = JSON.parse(fs.readFileSync(require.resolve('./package.json'), 'utf-8')).version;

  console.log(commandLineUsage([
    {
      header: `Book Randomness Determinizer 3000 v209.92.${version}`,
      content: 'Makes grand but generally rubbish claims about the randomness of books.',
    },
    {
      header: 'Synopsis',
      content: '-f [file] [file] ...',
    },
    {
      header: 'Options',
      optionList: [
        {
          name: 'help',
          alias: 'h',
          description: 'Shows documentation.',
          type: Boolean,
        },
        {
          name: 'folder',
          alias: 'f',
          description: 'Folder containing books, in plaintext, to "analyze".',
        },
      ],
    },
  ]));
  return;
}

main(opts);
