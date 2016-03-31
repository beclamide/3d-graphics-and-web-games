'use strict';

let camera, scene, renderer;
let commitData;
let commits = [];
let currentCommitIndex = 0;
let animating;
let tween;

document.addEventListener('DOMContentLoaded', function() {
  init();
});

function init() {
  getCommits().then((data) => {
    commitData = data;
    addEvents();
    createScene();
    animate();
    window.requestAnimationFrame(render);
  });
}

function getCommits() {
  let url = 'https://api.github.com/repos/mrdoob/three.js/commits?per_page=100&access_token=1d9f4fe8c6301ca0fe4b68128034ea6a801a786a';
  return fetch(url).then(response => response.json());
}

function getCommitInfo(url) {
  return fetch(url).then(response => response.json());
}

function addEvents() {
  document.addEventListener('keydown', (e) => {

      if (e.keyCode == 38) {
        if (currentCommitIndex < commits.length - 1) {
          currentCommitIndex++;
        }
      } else if (e.keyCode == 40) {
        if (currentCommitIndex > 0) {
          currentCommitIndex--;
        }
      }

      animate();

  });
}

function animate() {
  tween = TweenLite.to(camera.position, 0.5, {
    z: commits[currentCommitIndex].position.z + 800,
    onComplete: animationFinished
  });

  commits.forEach((div, index) => {
    if (index < currentCommitIndex) {
      div.element.className = 'commit previous';
    } else if (index > currentCommitIndex) {
      div.element.className = 'commit next';
    } else {
      div.element.className = 'commit';
    }
  });
}

function animationFinished() {
  animating = false;
}

function createScene() {

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 10000);
  camera.up.set(0, -1, 0);
  camera.position.x = 400;
  camera.position.y = 200;
  camera.position.z = 800;
  camera.rotation.x = -7 * (Math.PI / 180);
  camera.rotation.z = 3 * (Math.PI / 180);
  camera.rotation.y = 30 * (Math.PI / 180);

  scene = new THREE.Scene();

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let firstCommitDate = new Date(commitData[0].commit.author.date);
  commitData.forEach((commit) => {

    //console.log(commit);

    let commitDate = new Date(commit.commit.author.date);

    let div = document.createElement('div');
    div.className = 'commit';

    let avatar = commit.author ? commit.author.avatar_url : `http://placehold.it/350x350`;

    let htmlTemplate = `
    <table>
      <tr>
        <td>
          <img src="${avatar}"/>
        </td>
        <td>
          <h2>${commit.commit.committer.name}</h2>
          <p class="message">${commit.commit.message}</p>
          <p class="date">${moment(commitDate).format('MMMM Do YYYY, h:mm:ss a')}</p>
        </td>
      </tr>
    </table>
    `;
    div.innerHTML = htmlTemplate;

    let divObj = new THREE.CSS3DObject(div);
    divObj.position.y = 0;
    divObj.position.z = (commitDate - firstCommitDate) / 5000;
    scene.add(divObj);

    commits.push(divObj);
  });
}

function render() {


  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}
