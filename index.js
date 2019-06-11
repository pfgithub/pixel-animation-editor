// canvas
/* global document, window, arduinoExporter, v5Export */

let frames = [];
let currentFrame = -1;

const mainContextDom = document.getElementById("main");
const mainCtx = mainContextDom.getContext("2d");

const miniContextDom = document.getElementById("mini");
const miniCtx = miniContextDom.getContext("2d");

const urlParams = new URLSearchParams(window.location.search);

const WIDTH = +(urlParams.get("width") || 6);
const HEIGHT = +(urlParams.get("height") || 6);

mainContextDom.width = WIDTH;
mainContextDom.height = HEIGHT;

let id = mainCtx.createImageData(1, 1); // only do this once per page
let d  = id.data;                        // only do this once per page

mainCtx.imageSmoothingEnabled = false;

function updateMiniContextSize(){
  miniContextDom.height = HEIGHT;
  miniContextDom.width = WIDTH * frames.length;
  
  miniContextDom.style.width = `${WIDTH*frames.length}px`;
  miniContextDom.style.height = `${HEIGHT}px`;
  renderFrame();
}

function createContext(width, height){
  let canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return canvas.getContext("2d");
  //return mainCtx;
}

function fillPixel(a, x, y){
  d[0]   = 255*(!a);
  d[1]   = 255*(!a);
  d[2]   = 255*(!a);
  d[3]   = 255*a; // a = true; 255 = 
  frames[currentFrame].ctx.putImageData(id, x, y);
  if(!frames[currentFrame].data[y]) frames[currentFrame].data[y] = [];
  frames[currentFrame].data[y][x] = !!a;
  renderFrame();
}

function insertFrame(){
  currentFrame += 1;
  frames.splice(currentFrame, 0, {"ctx": createContext(20, 20), "data": []});
  updateMiniContextSize();
  renderFrame();
}

function copyFrame(){
  insertFrame();
  let copiedFrame = currentFrame - 1;
  frames[currentFrame].ctx.drawImage(frames[copiedFrame].ctx.canvas, 0, 0);
  frames[currentFrame].data = frames[copiedFrame].data.slice();
  renderFrame();
}

insertFrame();

document.getElementById("insert").addEventListener("click", () => {
  insertFrame();
});
document.getElementById("copy").addEventListener("click", () => {
  copyFrame();
});
document.getElementById("deletf").addEventListener("click", () => {
  frames.splice(currentFrame, 1);
  currentFrame--;
  updateMiniContextSize();
  renderFrame();
});
document.getElementById("left").addEventListener("click", () => {
  currentFrame--;
  currentFrame = Math.max(currentFrame, 0); // 
  updateMiniContextSize();
  renderFrame();
});
document.getElementById("right").addEventListener("click", () => {
  currentFrame++;
  currentFrame = Math.min(currentFrame, frames.length - 1);
  updateMiniContextSize();
  renderFrame();
});

document.getElementById("export").addEventListener("click", () => done());

function doClicked(e){
  if(e.preventDefault) e.preventDefault();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  if(e.stopPropagation) e.stopPropagation();
  fillPixel((e.button || -1) > 1 ? false : drawerase, Math.floor(e.clientX / (document.getElementById("main").clientWidth/WIDTH)), Math.floor(e.clientY / (document.getElementById("main").clientHeight/HEIGHT)));
  return false;
}

let mouseButtonPressed = -1;

document.getElementById("main").addEventListener("click", doClicked);
document.body.addEventListener("contextmenu", doClicked);
document.getElementById("main").addEventListener("touchdown", t => {Array.from(t.changedTouches).forEach(e => doClicked(e));});
document.getElementById("main").addEventListener("touchmove", t => {Array.from(t.changedTouches).forEach(e => doClicked(e));});
document.getElementById("main").addEventListener("mousedown", e => {doClicked(e); mouseButtonPressed = e.button;});

document.getElementById("main").addEventListener("mousemove", e => {
  if(mouseButtonPressed > -1) doClicked(e);
});
document.getElementById("main").addEventListener("mouseup", e => {mouseButtonPressed = -1;});
document.addEventListener("blur", () => {mouseButtonPressed = -1;});
document.addEventListener("focus", () => {mouseButtonPressed = -1;});

let drawerase = true;
document.getElementById("drawerase").addEventListener("click", () => {
  drawerase = !drawerase;
  document.getElementById("drawerase").innerText = drawerase ? "Draw" : "Erase";
});


let hotkeys = {};
Array.from(document.getElementsByTagName("button")).forEach(button => {
  hotkeys[button.getAttribute("hotkey")] = button;
  button.setAttribute("title", `Press ${button.getAttribute("hotkey")} to click`);
  button.addEventListener("click", () => button.blur());
});

document.addEventListener("keydown", e => {
  if(hotkeys[e.code]){
    hotkeys[e.code].click(e);
  }
});

function renderFrameOpacity(distance, alpha, ant){
  if(frames[currentFrame+distance]){
    mainCtx.globalAlpha = alpha;
    mainCtx.drawImage(frames[(!ant ? currentFrame : 0)+distance].ctx.canvas, 0, 0);
  }
}

function renderFrameMini(frame, alpha){
  if(frames[frame]){
    miniCtx.globalAlpha = 0.25;
    let color = (Math.floor(frame/2) == frame/2) ? 255 : 155;
    if(alpha > 0.9) color = 0;
    miniCtx.fillStyle = `rgba(${color}, ${color}, ${color}, 1.0)`;
    miniCtx.fillRect(WIDTH*frame, 0, WIDTH, HEIGHT);
    
    miniCtx.globalAlpha = alpha;
    miniCtx.drawImage(frames[frame].ctx.canvas, WIDTH*frame, 0);
    //console.log(frame, alpha, WIDTH*frame);
  }
}


function renderFrame(doNtShowOpacities){
  mainCtx.globalAlpha = 1.0;
  mainCtx.clearRect(0, 0, mainContextDom.width, mainContextDom.height);

  
  renderFrameOpacity(0, 1.0); // current
  if(!doNtShowOpacities){
    renderFrameOpacity(0, 1/16, true); // always show first frame
  
    renderFrameOpacity(1, 1/4); // one ahead
    
    renderFrameOpacity(-1, 1/2); // behind
    renderFrameOpacity(-2, 1/4);
    renderFrameOpacity(-3, 1/8);
  }

  document.getElementById("current").innerText = currentFrame;
  
  miniCtx.globalAlpha = 1.0;
  miniCtx.clearRect(0, 0, miniContextDom.width, miniContextDom.height);
  frames.forEach((frame, i) => {
    renderFrameMini(i, i == currentFrame ? 1.0 : 0.5);
  });
}

function download(filename, text, dnlshow){
  if(dnlshow){
    let myWindow=window.open("");
    let codeTag = myWindow.document.createElement("textarea");
    codeTag.setAttribute("id", "hello");
    codeTag.setAttribute("style", "position:fixed;top:0;left:0;width:100%;height:100%;");
    codeTag.value = text;
    myWindow.document.body.appendChild(codeTag);
    let range = myWindow.document.createRange();
    range.selectNode(myWindow.document.getElementById("hello"));
    myWindow.getSelection().addRange(range);
    myWindow.select();
    //window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    return;
  }
  
  let element = document.createElement("a");
  element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function done(){
  let resarr = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  console.log(JSON.stringify(resarr));
  download(`${window.prompt("Filename?")}.pattern.json`, JSON.stringify(resarr));
  download("", JSON.stringify(resarr), true);
}
document.getElementById("exportText").addEventListener("click", () => doneText());
document.getElementById("exportTextDnl").addEventListener("click", () => doneTextDnl());
document.getElementById("exportv5").addEventListener("click", () => doneTextv5());
function doneText(){
  let resarr = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download("", arduinoExporter(resarr), true);
}
function doneTextv5(){
  let resarr = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download("", v5Export(resarr, WIDTH, HEIGHT), true);
}
function doneTextDnl(){
  let resarr = [];
  frames.forEach(frame => {
    resarr.push(frame ? frame.data : []);
  });
  //window.prompt("ctrl+c", JSON.stringify(resarr));
  download(`${window.prompt("Filename?")}.txt.cpp`, arduinoExporter(resarr));
  download("", arduinoExporter(resarr), true);
}

let pause = false;
let playing = false;
document.getElementById("play").addEventListener("click", () => playS());
function playS(){
  if(!playing){
    play(currentFrame);
    document.getElementById("play").innerText = "Pause";
  }else{
    pause = true;
    playing = false;
    document.getElementById("play").innerText = "Play";
  }
}
document.getElementById("aspect").addEventListener("click", () => {
  mainContextDom.classList.toggle("fullwidth");
  document.getElementById("aspect").innerText = mainContextDom.classList.contains("fullwidth") ? "Square Mode" : "Rectangle Mode";
});
document.getElementById("resize").addEventListener("click", () => {
  let sure = window.confirm("Resize will delete your animation. OK = Delete animation and resize, Cancel = Continue working");
  if(!sure) return;
  let wh = window.prompt("width x height");
  let w = 6;
  let h = 6;
  if(wh.indexOf(",") > -1){
    w = +(wh.split(",")[0].trim());
    h = +(wh.split(",")[1].trim());
  }else
  if(wh.indexOf("x") > -1){
    w = +(wh.split("x")[0].trim());
    h = +(wh.split("x")[1].trim());
  }else{
    w = +(wh);
    h = +window.prompt("height");
  }
  urlParams.set("width", w);
  urlParams.set("height", h);
  window.location.href = `${window.location.pathname  }?${  urlParams.toString()}`;
});
function play(frame){
  playing = true;
  if(pause){pause = false; playing = false; return;}
  currentFrame = frame;
  renderFrame(true);
  if(frames[frame+1]) setTimeout(() => play(frame+1), document.getElementById("playSpeed").value);
  else setTimeout(() => play(0), document.getElementById("playSpeed").value);
}

setInterval(() => {if(!playing) renderFrame();}, 1000);
setInterval(() => {
  let prevFrame = currentFrame;
  currentFrame = Math.max(Math.min(currentFrame, frames.length - 1), 0);
  if(currentFrame != prevFrame) renderFrame();
  if(frames.length < 1) insertFrame();
}, 10);