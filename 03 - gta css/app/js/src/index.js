
import Pedestrian from './pedestrian.js';
import styles from '../../styles/main.scss';

let camera, scene, renderer, canvas, ctx;
let car, collisionpoint;
let keysdown = [];
let maxspeed = 5;
let speed = 0;
let angle = 0;
let steering = 0;
let prevmark;
let bloodsprites;

let peds = [];

window.map = [
  'wwwwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwxxxxxxxxxxxw',
  'wwwwwwwwwwx---------xw',
  'wwxxxxxxxxx-rrrrrrr-xw',
  'wwx-------x-rrrrrrr-xw',
  'wwx-x--rr---rr---rr-xw',
  'wwx-x-rrrrrrrr-x-rr-xw',
  'wwx---rrrrrrrr-x-rr-xw',
  'wwxgg-rr----rr-x-rr-xw',
  'wwxgg-rr-xx-rr-x-rr-xw',
  'wwxgg----xx-rr---rr-xw',
  'wwxgg-------rrrrrrr-xw',
  'wwxxxx------rrrrrrr-xw',
  'wwwwxxxxxxx---------xw',
  'wwwwwwwwwxxxxxxxxxxxxw',
  'wwwwwwwwwwwwwwwwwwwwww',
];

function init() {
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 10000);
  camera.up.set(0, -1, 0);
  camera.position.x = 500;
  camera.position.y = 500;
  camera.position.z = -800;

  scene = new THREE.Scene();

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  canvas = document.createElement('canvas');
  canvas.width = map[0].length * 100;
  canvas.height = map.length * 100;
  ctx = canvas.getContext('2d');
  let c = new THREE.CSS3DObject(canvas);
  c.position.x = ~~((map[0].length * 100) / 2) - 50;
  c.position.y = ~~((map.length * 100) / 2) - 50;
  c.position.z = -1;
  c.rotation.x = 180 * (Math.PI / 180)
  scene.add(c);

  bloodsprites = new Image();
  bloodsprites.src = 'images/blood.png';

  GenerateMap();

  GeneratePeds();

  AddCar();

  AddEvents();

  render();
}


function AddEvents() {
  document.addEventListener('keydown', function(e) {
    keysdown.push(e.which);
  });

  document.addEventListener('keyup', function(e) {
    do {
      var index = keysdown.indexOf(e.which);
      if (index > -1) {
        keysdown.splice(index, 1);
      }
    } while (index > -1)
  });

  document.addEventListener('ped_dead', function(e) {
    car.bloodtyres = 170;
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(e.detail.x + 50, e.detail.y + 50);
    ctx.rotate(car.rotation.z);
    ctx.translate(-64, -32);
    ctx.scale(1 + (Math.abs(speed) / 2), 1);
    ctx.drawImage(bloodsprites, 64*Math.floor(Math.random()*4), 0, 64, 64, 0, 0, 64, 64);
    ctx.restore();
  })

  window.addEventListener('resize', onWindowResize);
}

function GeneratePeds() {

  for (var i = 0; i < 20; i++) {
    peds.push(new Pedestrian());
    scene.add(peds[i].object);
  }

}


function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function GenerateMap() {

  let x = -1;
  let y = 0;
  let graph = [];

  for (var i in map) {

    graph.push([]);

    for (var v in map[i]) {

      let cellWeight = 0;

      if (map[i][v] == '-') {
        cellWeight = 1;
      } else {
        cellWeight = 2;
      }

      let building;

      if (map[i][v] == 'x') {

        //place building
        let bdiv = document.createElement('building');
        building = new THREE.CSS3DObject(bdiv);

        let topdiv = document.createElement('div');
        topdiv.className = 'top';
        let top = new THREE.CSS3DObject(topdiv);
        top.position.z = -200;
        top.rotation.x = 180 * Math.PI / 180;

        let rightdiv = document.createElement('div');
        rightdiv.className = 'right';
        let right = new THREE.CSS3DObject(rightdiv);
        right.position.x = 50;
        right.position.z = -100;
        right.rotation.x = -90 * Math.PI / 180;
        right.rotation.y = 90 * Math.PI / 180;

        let leftdiv = document.createElement('div');
        leftdiv.className = 'left';
        let left = new THREE.CSS3DObject(leftdiv);
        left.position.x = -50;
        left.position.z = -100;
        left.rotation.x = -90 * Math.PI / 180;
        left.rotation.y = -90 * Math.PI / 180;

        let frontdiv = document.createElement('div');
        frontdiv.className = 'front';
        let front = new THREE.CSS3DObject(frontdiv);
        front.position.y = 50;
        front.position.z = -100;
        front.rotation.x = -90 * Math.PI / 180;

        let backdiv = document.createElement('div');
        backdiv.className = 'back';
        let back = new THREE.CSS3DObject(backdiv);
        back.position.y = -50;
        back.position.z = -100;
        back.rotation.y = -180 * Math.PI / 180;
        back.rotation.x = -90 * Math.PI / 180;

        building.add(top).add(right).add(left).add(front).add(back);

      } else {

        let bdiv = document.createElement('building');
        building = new THREE.CSS3DObject(bdiv);

        let bottomdiv = document.createElement('div');
        bottomdiv.className = 'bottom ' + map[i][v];
        let bottom = new THREE.CSS3DObject(bottomdiv);
        bottom.rotation.x = 180 * Math.PI / 180;
        bottom.position.z = 0;
        building.add(bottom);
      }

      building.position.x = v * 100;
      building.position.y = i * 100;
      building.position.z = 0;
      scene.add(building);

      graph[graph.length-1].push(cellWeight);

    }
  }

  window.graph = new Graph(graph);
}


function AddCar() {
  // add car

  let cardiv = document.createElement('car');
  let body = new THREE.CSS3DObject(cardiv);
  body.rotation.x = 180 * (Math.PI / 180);
  body.rotation.z = 180 * (Math.PI / 180);

  let frontLeftWheel = document.createElement('wheel');
  let fl = new THREE.CSS3DObject(frontLeftWheel);
  fl.rotation.z = 90 * (Math.PI / 180);
  fl.position.x = 20;
  fl.position.y = -13;
  fl.position.z = 1;
  fl.rotation.x = 180 * (Math.PI / 180);

  let frontRightWheel = document.createElement('wheel');
  let fr = new THREE.CSS3DObject(frontRightWheel);
  fr.rotation.z = 90 * (Math.PI / 180);
  fr.position.x = 20;
  fr.position.y = 13;
  fr.position.z = 1;
  fr.rotation.x = 180 * (Math.PI / 180);

  let rearLeftWheel = document.createElement('wheel');
  let rl = new THREE.CSS3DObject(rearLeftWheel);
  rl.rotation.z = 90 * (Math.PI / 180);
  rl.position.x = -20;
  rl.position.y = -13;
  rl.position.z = 1;
  rl.rotation.x = 180 * (Math.PI / 180);

  let rearRightWheel = document.createElement('wheel');
  let rr = new THREE.CSS3DObject(rearRightWheel);
  rr.rotation.z = 90 * (Math.PI / 180);
  rr.position.x = -20;
  rr.position.y = 13;
  rr.position.z = 1;
  rr.rotation.x = 180 * (Math.PI / 180);

  let carwrapper = document.createElement('div');
  car = new THREE.CSS3DObject(carwrapper);
  car.add(fl).add(fr).add(rl).add(rr).add(body);
  car.position.x = 700;
  car.position.y = 700;
  car.position.z = -5;
  scene.add(car);

  car.body = body;

  prevmark = {
    l: {
      x: car.position.y - 25,
      y: car.position.y + 10
    },
    r: {
      x: car.position.y - 25,
      y: car.position.y - 10
    }
  };

  car.bloodtyres = 0;
}

function CheckCollision() {

  let rot = car.rotation.z;
  let col = false;

  let f = {
    x: car.position.x + (25 * Math.cos(rot)) - (Math.sin(rot)),
    y: car.position.y + (25 * Math.sin(rot)) + (Math.cos(rot))
  }

  let r = {
    x: car.position.x + (-25 * Math.cos(rot)) - (Math.sin(rot)),
    y: car.position.y + (-25 * Math.sin(rot)) + (Math.cos(rot))
  }

  let fx = ~~((f.x + 50) / 100);
  let fy = ~~((f.y + 50) / 100);
  let rx = ~~((r.x + 50) / 100);
  let ry = ~~((r.y + 50) / 100);

  if (fx < 0 || fy < 0) return;
  if (rx < 0 || ry < 0) return;
  if (fy > map.length) return;
  if (ry > map.length) return;
  if (fx > map[fy].length) return;
  if (rx > map[ry].length) return;

  if (map[fy][fx] == 'x') {
    speed = -speed;
    return true;
  }

  if (map[ry][rx] == 'x') {
    speed = -speed;
    return true;
  }

  return col;

}

function updateSkidmarks() {

  let rot = car.rotation.z;
  let ox = car.position.x;
  let oy = (car.position.y);
  let px = car.position.x - 25;
  let py = (car.position.y) + 12;
  let l = {
    x: Math.cos(rot) * (px - ox) - Math.sin(rot) * (py - oy) + ox,
    y: Math.sin(rot) * (px - ox) + Math.cos(rot) * (py - oy) + oy
  }

  py = (car.position.y) - 12;
  let r = {
    x: Math.cos(rot) * (px - ox) - Math.sin(rot) * (py - oy) + ox,
    y: Math.sin(rot) * (px - ox) + Math.cos(rot) * (py - oy) + oy
  }

  if (car.bloodtyres > 0) {
    car.bloodtyres -= 2;
  } else {
    car.bloodtyres = 0;
  }

  let a = ((maxspeed - Math.abs(speed)) / maxspeed) + (Math.abs(steering * 5));
  a += car.bloodtyres / 128;
  ctx.globalAlpha = a;
  ctx.strokeStyle = `rgba(${car.bloodtyres}, 0, 0, 1)`;

  ctx.beginPath();
  ctx.moveTo(prevmark.l.x + 50, prevmark.l.y + 50);
  ctx.lineTo(l.x + 50, l.y + 50);

  ctx.moveTo(prevmark.r.x + 50, prevmark.r.y + 50);
  ctx.lineTo(r.x + 50, r.y + 50);
  ctx.stroke();

  prevmark = {
    l: l,
    r: r
  }

}


// update
function update() {

  let prev = {
    x: car.position.x,
    y: car.position.y,
    rot: car.rotation.z
  }

  // steering
  if (keysdown.indexOf(39) != -1) {
    steering -= (steering > -0.01) ? 0.0008 : 0;
  } else if (keysdown.indexOf(37) != -1) {
    steering += (steering < 0.01) ? 0.0008 : 0;
  } else {
    steering *= 0.93;
  }

  angle += steering * speed;

  // gas
  if (keysdown.indexOf(38) != -1) {
    speed += (speed < maxspeed) ? 0.05 : 0;
  } else if (keysdown.indexOf(40) != -1) { // reverse
    speed -= (speed > -maxspeed / 2) ? 0.05 : 0;
  } else {
    speed *= 0.9;
  }

  let xdir = speed * Math.cos(angle);
  let ydir = speed * Math.sin(angle);

  if (car) {

    car.position.x += xdir;
    car.position.y += -ydir;
    car.rotation.z = -angle;

    camera.position.x -= (camera.position.x - car.position.x) / 50;
    camera.position.y -= (camera.position.y - car.position.y) / 50;

    let scale = 1 + (Math.random() / 20);
    car.body.scale.x = scale;
    car.body.scale.y = scale;

    camera.lookAt(new THREE.Vector3(car.position.x, car.position.y, 0))

    car.children[0].rotation.z = car.children[1].rotation.z = (90 + (steering * 2e3)) * (Math.PI / 180);

    if (CheckCollision()) {
      car.position.x = prev.x;
      car.position.y = prev.y;
      car.rotation.z = prev.rot;
    };

    updateSkidmarks();

  }

  updatePedestrians();
}

function updatePedestrians() {
  peds.forEach((ped) => {
    ped.tick();
    ped.checkCollision(car);
  });
}

function render() {
  update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

document.addEventListener('DOMContentLoaded', init);
