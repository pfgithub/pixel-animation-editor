function fixArrLen(arr, len, fill){
  while(arr.length < len){
    arr.push(fill);
  }
  return arr;
}

function v5Export(data, width, height) {
  let line = `  delay(100);
  states = new boolean[][]{
    { false, true, false, true, false, true },
    { true, false, true, false, true, false },
    { false, true, false, true, false, true },
    { true, false, true, false, true, false },
    { false, true, false, true, false, true },
    { true, false, true, false, true, false }
  };
  pushStates();`;
  
  data = JSON.parse(JSON.stringify(data));
  
  let fulldata = data.map(mdarr => {
    if(!mdarr) mdarr = [];
    mdarr = fixArrLen(mdarr, height, []);
    let indivdata = mdarr.map(darr => {
      if(!darr) darr = [];
      darr = fixArrLen(darr, width, false);
      return `{ ${darr.map(i=>i?"true":"false").join`, `} }`;
    });
    return `
  delay(100);
  states = new boolean[][]{
    ${indivdata.join`,\n    `}
  };
  pushStates();
    `;
  });
  return fulldata.join`\n`;
}