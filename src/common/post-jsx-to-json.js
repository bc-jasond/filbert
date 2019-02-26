const fs = require('fs');

// trim lines before and after blog 'sections' - we don't need those
function trimLines(lines) {
  let l;
  do {
    l = lines.shift()
  }
  while (!l.includes('ragment'));
  do {
    l = lines.pop()
  }
  while (!l.includes('ragment'));
}

// split a line on Tags & content (NodeText)
function tokenize(line) {
  const tokens = [];
  let token = '';
  for (let i = 0; i < line.length; i++) {
    const currentChar = line[i];
    if (currentChar === '<') {
      tokens.push(token);
      token = currentChar;
    } else if (currentChar === '>') {
      tokens.push(`${token}${currentChar}`);
      token = ''
    } else {
      token = `${token}${currentChar}`;
    }
  }
  return tokens.filter(token => token.trim().length);
}

fs.readFile('./src/pages/post-display-images.jsx', (err, data) => {
  if (err) throw err;
  const lines = data.toString().split('\n');
  trimLines(lines);
  const tokenizedLines = lines.map(line => tokenize(line));
  tokenizedLines;
});
