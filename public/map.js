const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const freqs = [500, 450, 400, 375, 333.33333, 300];
var svg;
var rowArr = [[1,2,3],[1,2,3],[2,1,3],[2,3,1],[3,2,1],[3,1,2],[1,3,2],[1,2,3]];
var rownum = 0;
var place = -1;
var viewy = 0;
var numbells = 3;
var gutter = 200;
var leftstart = 365;
var scale = 1;
var bell;
var mybell = 0;
var drive = false;
var clicked = false;
var moving = false;
var currentpos = 3;
var currentseg = {row: 1, target: 2, slope: 0};
var animations = [];
var speedbump = 0;
var playing = false;
var stop = false;
var atend;
var methods = [
  {title: "Stedman Doubles",
  stage: 5,
  pn: [[3],[1],[5],[3],[1],[3],[1],[3],[5],[1],[3],[1]]},
  {title: "Plain Bob Minimus",
  stage: 4,
  pn: ["x",[1,4],"x",[1,4],"x",[1,4],"x",[1,2]],
  huntbells: [1]}
];
var method;

$('div.dialog').hide();
$("#startdialog").centre().show();

$(function() {
  proportions();
  $("#viewbox").svg({onLoad: (o) => svg = o});
  
  getmethods();
  
  $("div.button").on("click", function() {
    //console.log(this.id);
    switch (this.id) {
      case "demo":
        // explain how this works
        $("#startdialog").hide();
        $("#demodialog").centre().show();
        break;
      case "lessons":
        // lesson options
        break;
      case "random":
        // pick a random method and go!
        changemethod(methods[Math.floor(Math.random()*methods.length)]);
        $("#dialogUnderlay,div.dialog").hide();
        break;
      case "choose":
        // choose method by title
        break;
    }
  });
  
  $("#trydemo").on("click", function() {
    changemethod(methods.find(o => o.title === "Grandsire Doubles"));
    $("#dialogUnderlay,div.dialog").hide();
  });
  
  $("#menu").on("click", function() {
    $("#dialogUnderlay").show();
    $("#startdialog").centre().show();
  });
  
  
  $("#mybell").on("change", function() {
    let val = Number($("#mybell option:checked").val());
    console.log(val);
    if (val === 0) {
      if (drive) {
        $("#drive").click();
      }
      $("#drive").prop("disabled", true);
      mybell = 0;
      changemethod(method);
    } else {
      $("#drive").prop("disabled", false);
      let ground = Number($("#ground").css("width").slice(0,-2));
      //gutter = 360/numbells;
      leftstart += (35 - ((numbells+1)/2-val)*gutter)*(ground <= 1000 ? 0.9*ground : 1000)/1000;
      $("#mapcontainer").css("left", leftstart+"px");
      $("#bellbox").css("left", leftstart+"px");
      $("path.bell"+mybell).attr("style","");
      /*
      if (mybell === 0) {
        $("#bellgroup,#speedbumps,#placelines").children().remove();
        
        for (let b = 1; b <= numbells; b++) {
          addsegments(b,1,1);
          addbell(b);
        }
        addbumps();
      }
      */
      mybell = val;
      currentpos = mybell;
      currentseg = {row: 0, target: mybell-1, slope: 0};
    }
    $("path.odd.bell"+mybell).css("fill", "blue");
    $("path.even.bell"+mybell).css("fill", "darkblue");
  });
  
  $("#start").on("click", function() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    playing = !playing;
    if (playing) {
      $("#start").text("Stop");
      if (!$("#reset").hasClass("disabled")) $("#reset").addClass("disabled");
      stop = false;
      
      strike();
    } else {
      $("#start").text("Go");
      stop = true;
      $("#reset").removeClass("disabled");
    }
    
    
  });
  
  $("#drive").on("click", function() {
    drive = !drive;
    if (drive) {
      let left = 34;
      let right = 56;
      $("#ground").append('<div id="buttoncontainer"><button id="leftarrow" type="button" style="left:'+left+'vw">⬅️</button><button id="rightarrow" type="button" style="left:'+right+'vw">➡️</button></div>');
      if (scale < 0.5) $("#buttoncontainer button").css({"font-size": "30pt", border: "none"})
      $("body").on("keydown", keysteer);
      $("#buttoncontainer > button").on("click", function() {
        if (!clicked) {
          steer(this.id);
        }
      });
    } else {
      $("#buttoncontainer").remove();
      $("body").off("keydown", keysteer);
    }
  });
  
  $("#reset").on("click", function() {
    if (!$("#reset").hasClass("disabled")) {
      reset();
    }
  });
  
  
});

function keysteer(e) {
  if ([37,39].includes(e.which) && !clicked) {
    steer(e.which === 37 ? "leftarrow" : "rightarrow");
  }
}

function getmethods(n) {
  $.get("methods.json", function(data) {
    methods = data;
    if (n > -1 && n < methods.length) changemethod(methods[n]);
  });
}

function proportions() {
  let frame = $('iframe[src="https://wood-creative-tachometer.glitch.me"]');
  let ground = Number($("#ground").css("width").slice(0,-2));
  
  let left;
  if (ground > 1000) {
    left = (ground-1000)/2;
    
  } else {
    scale = 0.9*ground/1000;
    left = .05*ground;
    if (scale < 0.5) $("#mapcontainer").css("height",(scale*975)+"px");
    $("#mapcontainer").css({"transform": "rotateX(90deg) translateZ(-18px) scale("+scale+")", width: (0.9*ground)+"px"});
    let z = scale*650;
    $("#bellbox").css("transform", "translateZ("+z+"px) scale("+scale+")");
  }
  $("#mapcontainer").css("left", left+"px");
  $("#bellbox").css("left", left+"px");
  leftstart = left;
  
}

function strike() {
  while (animations[0] && animations[0].target <= place && animations[0].row <= rownum) {
    animations.shift();
  }
  if (mybell !== 0) {
    follow();
  } else {
    if (bell && rowArr[rownum+1]) {
      let p2 = rowArr[rownum+1].indexOf(bell);
      let diff = p2-place;
      let gap = rownum%2 === 1;
      
      if (place != p2) {

        let dur = (rownum%2 === 1 ? 1.6 : 1.2) + diff*.4;

        let left = ((numbells+1)/2-p2-1)*(gutter+5);

        $("#bell"+bell).css("transition", "transform "+dur+"s linear");
        $("#bell"+bell).css("transform","translateX("+left+"px)");



      }
    }
  }
  place++;
  if (place === numbells) {
    rownum++;
    place = 0;
  }
  if (rowArr[rownum]) {
    let gap = rownum%2 === 0 && place === 0 && rownum > 0;
    viewy += gap ? 100 : 50;
    let viewbox = "0 "+viewy+" 1000 650";
    bell = rowArr[rownum][place];
    if (drive) {
      if (bell !== mybell) {
        playbell(bell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
      }
      if (currentpos === place+1 && currentseg.row <= rownum) {
        playbell(mybell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
      }
      
      
    } else {
      playbell(bell, audioCtx.currentTime+(gap ? 0.7 : 0.3));
    }
    //if (speedbump !== 0) $("#speedbumps path:nth-child("+speedbump+")").attr("style", "");
    speedbump++;
    //$("#speedbumps path:nth-child("+speedbump+")").css("stroke","yellow");
    $("#viewbox").animate({top: viewy+"px"}, (gap ? 800 : 400), "linear", stop ? null : strike);
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

function reset() {
  rownum = 0;
  place = -1;
  let height = rowArr.length*numbells*50 + rowArr.length*25 + 600;
  viewy = 710-height;
  $("#viewbox").css("top", viewy+"px");
  $("#mapcontainer").css("left", leftstart+"px");
  animations = [];
  speedbump = 0;
  bell = null;
  stop = false;
  for (let b = 1; b <= numbells; b++) {
    $("#bell"+b).attr({style: "transform:translateX("+bellpos(b)+"px);"});
  }
  $("#reset").addClass("disabled");
}

function changemethod(obj) {
  method = obj;
  $("#title").text(obj.title);
  numbells = obj.stage;
  gutter = 600/numbells;
  rowArr = buildrows(obj.pn,obj.stage);
  let height = rowArr.length*numbells*50 + rowArr.length*25 + 600;
  viewy = 710-height;
  $("#viewbox").attr("viewBox", "0 "+(650-height)+" 1000 "+height);
  $("#viewbox").css("top", viewy+"px");
  $("#bellgroup,#speedbumps,#placelines").children().remove();
  $("#mybell option:nth-child(n+2)").remove();
  for (let b = 1; b <= numbells; b++) {
    $("#mybell").append('<option value="'+b+'">'+b+'</option>');
    addsegments(b,1,1);
    //svg.path($("#placelines"),buildpath(b));
    addbell(b);
  }
  addbumps();
  obj.huntbells.forEach(b => {
    $("path.bell"+b).css("fill", "#a00");
    $("#bell"+b+" path").css("fill", "pink");
  });
}

function steer(arrow) {
  clicked = true;
  moving = true;
  $("#buttoncontainer button").addClass("disabled");
  let dur = arrow === "leftarrow" ? (numbells+1)*.4 : (numbells-1)*.4;
  let left;
  let slope = arrow === "leftarrow" ? 1 : -1;
  currentpos += slope;
  //console.log(currentpos);
  currentseg = {target: currentpos, slope: slope, row: place === 0 ? rownum : rownum+1, dur: numbells+slope};
  left = leftstart - (mybell-currentpos)*gutter*scale;
  modifyanims(slope,numbells+slope);
  $("#mapcontainer").css({transition: "left "+dur+"s linear", left: left+"px"});
  setTimeout(() => {
    clicked = false;
    $("#buttoncontainer button").removeClass("disabled");
  }, 400);
  clearTimeout(atend);
  atend = setTimeout(() => {
    moving = false;
    modifyanims(0,1);
  }, dur*1000);
}

function follow() {
  if (bell) {
    let gap = rownum%2;
    let next = rowArr[rownum+1] ? rowArr[rownum+1].indexOf(bell) : place;
    let slope = next-place;
    let dur = numbells+slope+gap;
    
    if (bell === mybell && !drive) {
      //console.log(next);
      if (slope !== 0) {
        let left = leftstart - (mybell-next-1)*gutter*scale;
        //console.log(leftstart, left);
        $("#mapcontainer").css({transition: "left "+(dur*.4)+"s linear", left: left+"px"});
      }
      modifyanims(slope,dur);
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

function modifyanims(slope, dur) {
  for (let i = 0; i < animations.length; i++) {
    let o = animations[i];
    let b = o.bell;
    let totalslope = (o.slope-slope/dur)*gutter*-207/200;
    let l = Number($("#bell"+b).css("transform").split(", ")[4]);
    let d = (o.endtime-audioCtx.currentTime)/.4;
    let nl = totalslope*d+l;
    $("#bell"+b).css({transition: "transform "+(d*.4)+"s linear", transform: "translateX("+nl+"px)"});
  }
}

function leadends(l,color) {
  for (let rn = l; rn < rowArr.length; rn+=l) {
    for (let b = 0; b < numbells; b++) {
      let n = rn+2 + b*(rowArr.length+1);
      $("#placelines path:nth-child("+n+"),#placelines path:nth-child("+(n+1)+")").css("fill", color);
    }
  }
}

function buildrows(pn, stage) {
  let arr = [[],[]];
  for (let p = 1; p <= stage; p++) {
    arr[0].push(p);
    arr[1].push(p);
  }
  let prevrow = arr[1];
  let leads = 0;
  do {
    for (let i = 0; i < pn.length; i++) {
      let row = [];
      let dir = 1;
      for (let p = 0; p < stage; p++) {
        if (pn[i] !== "x" && pn[i].includes(p+1)) {
          row.push(prevrow[p]);
        } else {
          row.push(prevrow[p+dir]);
          dir *= -1;
        }
      }
      arr.push(row);
      prevrow = row;
    }
    leads++;
  } while (prevrow.some((n,i) => n !== i+1) && leads < 8);
  //console.log(arr);
  return arr;
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

function addsegments(b, first, length) {
  let left = ((numbells+1)/2-b)*gutter+465;
  let y = 600-50*b;
  let seg = ["M", left, "600", "v", -50*b].join(" ");
  if (first > 1) {
    seg += " " + buildsegment(b, rowArr.slice(0,first),1) + " v "+(50*b);
    y -= numbells*(first-2)*50 + Math.floor(first/2)*50 + 50*rowArr[first-1].indexOf(b);
    left = 465 + gutter*((numbells+1)/2-rowArr[first-1].indexOf(b)-1);
  } else {
    seg += " h 70 v "+(50*b);
  }
  svg.path($("#placelines"), seg, {class: "odd bell"+b});
  let j = 1;
  let rn = first;
  let p = rowArr[first-1].indexOf(b);
  while (rn < rowArr.length) {
    let rows = rowArr.slice(rn-1,rn+length);
    let p2 = rows[rows.length-1].indexOf(b);
    seg = ["M",left,y].join(" ") + buildsegment(b, rows, (rn-1)%2);
    svg.path($("#placelines"), seg, {class: (j === 1 ? "even" : "odd") + " bell"+b});
    for (let i = 1; i <= length; i++) {
      y -= (numbells + (rn-1)%2)*50;
      rn++;
    }
    y -= (p2-p)*50;
    left = 465 + gutter*((numbells+1)/2-p2-1);
    p = p2;
    j *= -1;
  }
  seg = ["M", left, y, "v", "-800", "h", "70", "v", "800"].join(" ");
  svg.path($("#placelines"),seg, {class: (j === 1 ? "even" : "odd") + " bell"+b});
  
}

function buildsegment(b,rows,back) {
  let arr = [];
  let p = rows[0].indexOf(b);
  let rn = 1;
  
  while (rn < rows.length) {
    let place = rows[rn].indexOf(b);
    let diff = place - p;
    let gap = rn%2 === back ? -50 : 0;
    let a;
    let angle, extra;
    switch (diff) {
      case 0:
        if (arr.length && arr[arr.length-1][0] === "v" && arr[arr.length-1].length === 2) {
          arr[arr.length-1][1] -= 50*numbells - gap;
        } else {
          a = ["v", -50*numbells + gap];
          arr.push(a);
        }
        break;
      case 1: case -1:
        angle = Math.atan(gutter/(50*(numbells+diff)-gap))/2;
        extra = 70*Math.tan(angle);
        let v = ["v",-extra];
        a = ["l", -diff*gutter, -50*(numbells+diff) + gap + extra];
        diff === 1 ? arr.push(a.concat(v)) : arr.push(v.concat(a));
        break;
    }
    p = place;
    rn++;
  }
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
  return bigarr.join(" ");
}

function buildpath(b) {
  let arr = [["v",-50*(numbells+1)-50*(b-1)]];
  let rn = 2;
  
  let p = b-1;
  while (rn < rowArr.length) {
    let place = rowArr[rn].indexOf(b);
    let diff = place - p;
    let gap = rn%2 === 0 ? -50 : 0;
    let a;
    let angle, extra;
    switch (diff) {
      case 0:
        if (arr[arr.length-1][0] === "v" && arr[arr.length-1].length === 2) {
          arr[arr.length-1][1] -= 50*numbells - gap;
        } else {
          a = ["v", -50*numbells + gap];
          arr.push(a);
        }
        break;
      case 1: case -1:
        angle = Math.atan(gutter/(50*(numbells+diff)-gap))/2;
        extra = 70*Math.tan(angle);
        let v = ["v",-extra];
        a = ["l", -diff*gutter, -50*(numbells+diff) + gap + extra];
        diff === 1 ? arr.push(a.concat(v)) : arr.push(v.concat(a));
        break;
    }
    p = place;
    rn++;
  }
  arr.push(["v",-650-50*(numbells-b)]);
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
  let offset = (numbells+1)/2 -b;
  let left = offset*gutter+465;
  return "M "+left+" 600 "+bigarr.join(" ");
}