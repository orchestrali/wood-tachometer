const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const freqs = [450, 400, 375, 333.33333, 300];
var svg;
var rowArr = [[1,2,3],[1,2,3],[2,1,3],[2,3,1],[3,2,1],[3,1,2],[1,3,2],[1,2,3]]; //
var rownum = 0;
var place = -1;
var viewy = -940;
var numbells = 3;
var gutter = 120;
var leftstart = 365;
var bell;
var mybell = 3;
var drive;
var dx = 0;
var theta = 0;
var clicked = false;
var moving = false;
var currentpos = 3;
var currentseg = {row: 1, target: 2, slope: 0};
var animations = [];
var moves;
const methods = [
  {title: "Stedman Doubles",
  stage: 5,
  pn: [[3],[1],[5],[3],[1],[3],[1],[3],[5],[1],[3],[1]]},
  {title: "Plain Bob Minimus",
  stage: 4,
  pn: ["x",[1,4],"x",[1,4],"x",[1,4],"x",[1,2]]}
];


$(function() {
  //console.log($("#mapcontainer").css("width"));
  proportions();
  $("#viewbox").svg({onLoad: (o) => {
    svg = o;
  }});
  
  //changemethod(methods[1]);
  //addbumps();
  for (let b = 1; b <= numbells; b++) {
    svg.path($("#placelines"), buildpath(b));
    //addbell(b);
  }
  //svg.path($("#placelines"), buildpath(3));
  //buildcoords();
  //console.log(moves[0]);
  $("#start").on("click", function() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    drive = false;
    clicked = false;
    strike();
    
  });
  
  $("#button").on("click", function() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    $("#ground").append('<div id="buttoncontainer"><button id="leftarrow" type="button">⬅️</button><button id="rightarrow" type="button">➡️</button></div>');
    $("#buttoncontainer > button").on("click", function() {
      if (!clicked) {
        steer(this.id);
      }
    });
    highlight(3);
    drive = true;
    strike();
    
  });
});

function proportions() {
  let ground = Number($("#ground").css("width").slice(0,-2));
  console.log(ground);
  let left;
  if (ground > 1000) {
    left = (ground-1000)/2-100;
    
  } else {
    let scale = 0.9*ground/1000;
    left = .05*ground;
    $("#mapcontainer").css("transform", "rotateX(90deg) scale("+scale+")");
    let z = scale*630;
    $("#bellbox").css("transform", "translateZ("+z+"px) scale("+scale+")");
  }
  left += (35 - ((numbells+1)/2-mybell)*gutter)*(ground <= 1000 ? 0.9*ground : 1000)/1000;
  $("#mapcontainer").css("left", left+"px");
  $("#bellbox").css("left", left+"px");
  leftstart = left;
}


var places = [-185];
for (let i = 1; i < numbells; i++) {
  places.unshift(gutter*207/200*i-185);
  places.push(-185-gutter*207/200*i);
}

function strike() {
  while (animations[0] && animations[0].target <= place && animations[0].row <= rownum) {
    animations.shift();
  }
  follow();
  /*
  if (!drive) {
    
  } else 
    if (bell && rowArr[rownum+1] && (!drive || bell !== mybell)) {
    
      let p2 = rowArr[rownum+1].indexOf(bell);
      let diff = p2-place;
      let gap = rownum%2 === 1;
      let dur = (numbells+diff+rownum%2)*.4;
      
      if (place != p2) {
        let left;
        if (drive) {
          let obj = {bell: bell, target: p2, row: rownum+1, slope: diff};
          animations.push(obj);
          let offset = p2 - currentpos+1;
          left = places[Math.floor(places.length/2)+offset];
          if (moving && currentseg.target > p2) {
            
          }
        } else {
          left = gutter*207/200*(numbells-1-p2)-185;
        }
        
        $("#bell"+bell).css("transition", "transform "+dur+"s linear");
        $("#bell"+bell).css("transform","translateX("+left+"px)");
      } else if (drive) {
        $("#bell"+bell).css("transition", "transform "+dur+"s linear");
        let obj = {bell: bell, target: p2, row: rownum+1, slope: diff};
        animations.push(obj);
      }
    
    
  }
  */
  place++;
  if (place === numbells) {
    rownum++;
    place = 0;
  }
  if (rowArr[rownum]) {
    
    let gap = rownum%2 === 0 && place === 0 && rownum > 0;
    viewy += gap ? 100 : 50;
    bell = rowArr[rownum][place];
    if (drive) {
      if (bell !== mybell) {
        playbell(bell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
      }
      if (currentpos === place+1) {
        playbell(mybell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
      }
      
      
    } else {
      playbell(bell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
    }
    
    
    
    $("#viewbox").animate({top: viewy+"px"}, (gap ? 800 : 400), "linear", strike);
  }
  
}

var testarray = [
  {row: 1, place: 0, id: "#bell1", css: {transition: "transform "+(5*.4)+"s linear", transform: "translateX("+places[1]+"px)"}},
  {row: 1, place: 1, id: "#bell2", css: {transition: "transform "+(3*.4)+"s linear", transform: "translateX("+places[0]+"px)"}},
  {row: 2, place: 1, id: "#bell1", css: {transition: "transform .4s linear", transform: "translateX("+(places[1]-185/4)+"px)"}, gloss: "between 1 and 2"},
  {row: 2, place: 2, id: "#mapcontainer", css: {transition: "left .8s linear", left: "-100px"}},
  {row: 2, place: 2, id: "#bell1", css: {transition: "transform .8s linear", transform: "translateX("+(places[3]+185/4)+"px)"}, gloss: "between 2 and 3"},
  {row: 2, place: 2, id: "#bell2", css: {transition: "transform .4s linear", transform: "translateX("+(places[0]-185/2)+"px)"}, gloss: "between 0 and 1"},
  {row: 3, place: 0, id: "#bell2", css: {transition: "transform .4s linear", transform: "translateX("+(places[1]-185/5)+"px)"}, gloss: "between 1 and 2"},
  {row: 3, place: 1, id: "#bell1", css: {transition: "transform .4s linear", transform: "translateX("+(places[3]-185/3)+"px)"}, gloss: "between 3 and 4"},
  {row: 3, place: 1, id: "#mapcontainer", css: {transition: "left 1.2s linear", left: "-300px"}},
  {row: 3, place: 1, id: "#bell2", css: {transition: "transform 1.2s linear", transform: "translateX("+(places[3]+185/5)+"px)"}, gloss: "between 2 and 3"},
  {row: 3, place: 2, id: "#bell1", css: {transition: "transform .8s linear", transform: "translateX("+places[4]+"px)"}},
  {row: 4, place: 0, id: "#bell2", css: {transition: "transform .4s linear", transform: "translateX("+(places[3])+"px)"}},
  {row: 4, place: 1, id: "#bell2", css: {transition: "transform .8s linear", transform: "translateX("+(places[3]-185/2)+"px)"}, gloss: "between 3 and 4"},
  {row: 4, place: 2, id: "#bell1", css: {transition: "transform .4s linear", transform: "translateX("+(places[3]-185/2)+"px)"}, gloss: "between 3 and 4"},
  {row: 5, place: 0, id: "#mapcontainer", css: {transition: "left 2s linear", left: "-100px"}},
  {row: 5, place: 0, id: "#bell1", css: {transition: "transform .4s linear", transform: "translateX("+(places[3]+185/5)+"px)"}, gloss: "between 2 and 3"},
  {row: 5, place: 0, id: "#bell2", css: {transition: "transform .8s linear", transform: "translateX("+(places[3]-2*185/5)+"px)"}},
  {row: 5, place: 1, id: "#bell1", css: {transition: "transform 1.2s linear", transform: "translateX("+(places[1]-185/5)+"px)"}},
  {row: 5, place: 2, id: "#bell2", css: {transition: "transform 1.2s linear", transform: "translateX("+places[3]+"px)"}},
  {row: 6, place: 0, id: "#bell1", css: {transition: "transform .4s linear", transform: "translateX("+places[1]+"px)"}},
  {row: 6, place: 1, id: "#mapcontainer", css: {transition: "left 1.6s linear", left: "100px"}},
  {row: 6, place: 1, id: "#bell1", css: {transition: "transform 1.6s linear", transform: "translateX("+places[0]+"px)"}},
  {row: 6, place: 1, id: "#bell2", css: {transition: "transform .4s linear", transform: "translateX("+(places[3]+185/4)+"px)"}},
  {row: 6, place: 2, id: "#bell2", css: {transition: "transform .8s linear", transform: "translateX("+(places[1]-185/4)+"px)"}},
  {row: 7, place: 1, id: "#bell2", css: {transition: "transform .4s linear", transform: "translateX("+places[1]+"px)"}}
];
function buildmoves() {
  
}

function buildcoords() {
  let list = [];
  let coords = [];
  let mycoords;
  for (let b = 1; b <= numbells; b++) {
    let arr = rowArr.map((a,i) => {
      let p = a.indexOf(b);
      let t = i*numbells + Math.floor(i/2) + p;
      return [t, p, i];
    });
    arr.push(arr[arr.length-1].map((n,i) => i === 0 ? n+numbells+1 : i === 2 ? n+1 : n));
    b === mybell ? mycoords = arr : coords.push({bell: b, arr: arr});
  }
  
  coords.forEach(o => {
    let b = o.bell;
    let left = places[Math.floor((places.length-1)/2)+b-mybell];
    for (let i = 1; i < o.arr.length-1; i++) {
      
      let cc = o.arr[i];
      let next = o.arr[i+1];
      let dp = next[1]-cc[1]; //change in place
      let totaldur = next[0]-cc[0];
      let j = mycoords.findIndex(a => a[0] > cc[0]);
      let k = mycoords.findIndex(a => a[0] > next[0]);
      let myseg = mycoords.slice(j-1, k === -1 ? mycoords.length : k+1);
      if (myseg.every(a => a[1] === myseg[0][1]) && dp !== 0) {
        
        let offset = next[1] - myseg[0][1];
        left = places[Math.floor((places.length-1)/2)+offset];
        let obj = {row: cc[2], place: cc[1], id: "#bell"+b, css: {transition: "transform "+(totaldur*.4)+"s linear", transform: "translateX("+(left)+"px)"}};
        //if (i === 1) console.log(left);
        list.push(obj);
      } else if (myseg.some(a => a[1] !== myseg[0][1])) {
        
        let time = cc;
        for (let mc = 1; mc < myseg.length; mc++) {
          
          let slope = (dp/totaldur - (myseg[mc][1]-myseg[mc-1][1])/(myseg[mc][0]-myseg[mc-1][0]))*-gutter;
          let point = next[0] < myseg[mc][0] ? next : myseg[mc];
          if (slope !== 0) {
            let target = slope*(point[0]-time[0])+left;
            let obj = {row: time[2], place: time[1], id: "#bell"+b, css: {transition: "transform "+((point[0]-time[0])*.4)+"s linear", transform: "translateX("+target+"px)"}};
            list.push(obj);
            left = target;
          }
          time = point;
        }
      }
      
    }
  });
  moves = list;
  
  let left = leftstart;
  for (let i = 0; i < mycoords.length-1; i++) {
    let a = mycoords[i];
    let dur = (mycoords[i+1][0]-a[0])*.4;
    let next = leftstart - (numbells - mycoords[i+1][1]-1)*gutter;
    if (next !== left) {
      let o = {row: a[2], place: a[1], id: "#mapcontainer", css: {transition: "left "+dur+"s linear", left: next+"px"}};
      left = next;
      moves.push(o);
    }
    
  }
}

function highlight(b) {
  let i = 1;
  for (let rn = 0; rn < rowArr.length; rn++) {
    for (let p = 0; p < numbells; p++) {
      let n = rowArr[rn][p];
      if (n === b) $("#speedbumps > path:nth-child("+i+")").attr("stroke", "blue");
      i++;
    }
  }
}

function steer(arrow) {
  clicked = true;
  moving = true;
  console.log("rownum "+rownum);
  console.log("place "+place);
  $("#buttoncontainer button").addClass("disabled");
  let dur = arrow === "leftarrow" ? (numbells+1)*.4 : (numbells-1)*.4;
  let left;
  let slope = arrow === "leftarrow" ? 1 : -1;
  currentpos += slope;
  currentseg = {target: currentpos, slope: slope, row: place === 0 ? rownum : rownum+1, dur: numbells+slope};
  left = leftstart - (numbells-currentpos)*gutter;
  let gap = rownum%2;
  for (let i = 0; i < animations.length; i++) {
        let o = animations[i];
        
        let b = o.bell;
        let totalslope = (o.slope-slope/(numbells+slope))*gutter*-207/200;
        let l = Number($("#bell"+b).css("transform").split(", ")[4]);
        
        let d = (o.endtime-audioCtx.currentTime)/.4;
        let nl = totalslope*d+l;
        $("#bell"+b).css({transition: "transform "+(d*.4)+"s linear", transform: "translateX("+nl+"px)"});
      }
  /*
  for (let i = 0; i < animations.length; i++) {
    let o = animations[i];
    if (o.row > rownum || (o.row === rownum && o.target > place)) {
      let offset = o.target - currentpos + 1;
      let d = ((o.row-rownum)*numbells + o.target - place + (o.row+1)%2)*.4;
      //console.log(o);
      let l = places[Math.floor(places.length/2)+offset];
      if (d < dur) {
        let extra = d/dur*185;
        let other = o.target-o.slope - (currentpos-1-slope);
        let from = places[Math.floor(places.length/2)+other];
        let dir = (l-from);
        l = dir > 0 ? from + extra : from - extra;
      }
      $("#bell"+o.bell).css("transition", "transform "+d+"s linear");
      $("#bell"+o.bell).css("transform","translateX("+l+"px)");
    }
    
  }
  */
  $("#mapcontainer").css({transition: "left "+dur+"s linear", left: left+"px"});
  setTimeout(() => {
    clicked = false;
    $("#buttoncontainer button").removeClass("disabled");
  }, 400);
  setTimeout(() => {
    moving = false;
    for (let i = 0; i < animations.length; i++) {
      let o = animations[i];
      let b = o.bell;
      let totalslope = o.slope*gutter*-207/200;
      let l = Number($("#bell"+b).css("transform").split(", ")[4]);
      let d = (o.endtime-audioCtx.currentTime)/.4;
      let nl = totalslope*d+l;
      $("#bell"+b).css({transition: "transform "+(d*.4)+"s linear", transform: "translateX("+nl+"px)"});
    }
  }, dur*1000);
}


function follow() {
  //moves.filter(o => o.row === rownum && o.place === place).forEach(o => {
    //console.log(o);
    //$(o.id).css(o.css);
  //});
  
  if (bell) {
    let gap = rownum%2;
    let next = rowArr[rownum+1] ? rowArr[rownum+1].indexOf(bell) : place;
    let slope = next-place;
    let dur = numbells+slope+gap;
    
    if (bell === mybell && !drive) {
      if (slope !== 0) {
        let left = leftstart - (numbells-next-1)*gutter;
        $("#mapcontainer").css({transition: "left "+(dur*.4)+"s linear", left: left+"px"});
        
      }
      
      for (let i = 0; i < animations.length; i++) {
        let o = animations[i];
        
        let b = o.bell;
        let totalslope = (o.slope-slope/dur)*gutter*-207/200;
        let l = Number($("#bell"+b).css("transform").split(", ")[4]);
        
        let d = (o.endtime-audioCtx.currentTime)/.4; //Math.min(dur, (o.endtime-audioCtx.currentTime)/.4); //(o.row === rownum+1 ? numbells : 0)+o.target-place+(o.row === rownum+1 && gap ? 1 : 0)
        let nl = totalslope*d+l;
        $("#bell"+b).css({transition: "transform "+(d*.4)+"s linear", transform: "translateX("+nl+"px)"});
      }
    } else if (bell !== mybell) {
      let myslope;
      switch (drive) {
        case false:
          let myrow = rowArr[rownum].indexOf(mybell) > place ? rownum-1 : rownum;
          myslope = (rowArr[myrow] && rowArr[myrow+1]) ? rowArr[myrow+1].indexOf(mybell)-rowArr[myrow].indexOf(mybell) : 0;
          myslope /= numbells+myslope+myrow%2;
          break;
        case true:
          myslope = moving ? currentseg.slope/currentseg.dur : 0;
          break;
      }
      
      let obj = {bell: bell, target: next, row: rownum+1, slope: slope/dur, endtime: audioCtx.currentTime+dur*.4};
      animations.push(obj);
      
      if (!(slope === 0 && myslope === 0)) {
        let totalslope = (slope/dur-myslope)*gutter*-207/200;
        
        let left = Number($("#bell"+bell).css("transform").split(", ")[4]);
        
        let nextleft = totalslope*(dur)+left;
        $("#bell"+bell).css({transition: "transform "+(dur*.4)+"s linear", transform: "translateX("+nextleft+"px)"});
      }
    }
    
    
    
  }
  
  
}


function playbell(n, t) {
  let value = freqs.slice(-numbells)[n-1];
  const osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = value;
  const env = audioCtx.createGain();
  env.gain.exponentialRampToValueAtTime(0.001, t + 1);
  
  osc.connect(env).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t+1);
}

function addbumps() {
  let y = 550;
  for (let rn = 0; rn < rowArr.length; rn++) {
    for (let p = 1; p <= numbells; p++) {
      let path = ["M", ((numbells+1)/2-p)*gutter+465, y, "h 70"].join(" ");
      svg.path($("#speedbumps"), path);
      y -= 50;
    }
    y -= rn%2 === 1 ? 50 : 0;
  }
}

function addbell(b) {
  let g = svg.group($("#bellgroup"),"bell"+b, {style: "transform:translateX("+bellpos(b)+"px);"});
  svg.path(g, "M475 90 v -35 q 0 -35 25 -35 q 25 0 25 35 v 35 h -50");
  svg.text(g, 495, 50, b.toString(), {style: "fill:black;"});
}

function bellpos(b) {
  let translate;
  translate = ((numbells+1)/2-b)*(gutter+5);
  //console.log(translate);
  return translate;
}


function buildpath(b) {
  let arr = [["v",50*(numbells+1)+50*(b-1)]];
  let rn = 2;
  
  let p = b-1;
  while (rn < rowArr.length) {
    let place = rowArr[rn].indexOf(b);
    let diff = place - p;
    let gap = rn%2 === 0 ? 50 : 0;
    let a;
    let angle, extra;
    switch (diff) {
      case 0:
        if (arr[arr.length-1][0] === "v" && arr[arr.length-1].length === 2) {
          arr[arr.length-1][1] += 50*numbells + gap;
        } else {
          a = ["v", 50*numbells + gap];
          arr.push(a);
        }
        break;
      case 1: case -1:
        angle = Math.atan(gutter/(50*(numbells+diff)+gap))/2;
        extra = 70*Math.tan(angle);
        let v = ["v",extra];
        a = ["l", diff*gutter, 50*(numbells+diff) + gap - extra];
        diff === -1 ? arr.push(a.concat(v)) : arr.push(v.concat(a));
        break;
    }
    p = place;
    rn++;
  }
  arr.push(["v",1000]);
  let rev = [];
  arr.forEach(a => {
    let alt = [a[0]];
    for (let i = 1; i < a.length; i++) {
      if (["l","v"].includes(a[i])) {
        alt.push(a[i]);
      } else {
        alt.push(-a[i]);
      }
    }
    rev.unshift(alt);
  });
  arr.push(["h",70]);
  let bigarr = arr.concat(rev).map(a => a.join(" "));
  let offset = b-(numbells+1)/2;
  let left = offset*gutter+465;
  return "M "+left+" 0 "+bigarr.join(" ");
}