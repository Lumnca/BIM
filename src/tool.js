import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    Raycaster,
    Vector2,
    Vector3,
    MeshLambertMaterial,
    Line,
    LineBasicMaterial,
    BufferGeometry,
    MeshPhongMaterial,
    Mesh,
    Color,
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
const TWEEN = require('@tweenjs/tween.js')
//加载STL文件
function loadSTLModel() {
    return new Promise((res, rej) => {
        var stlLoder = new STLLoader();
        stlLoder.load('assets/szc.STL', function (geometry) {
            geometry.computeBoundingBox();
            modelTranlate(geometry);
            const material = new MeshPhongMaterial({ color: 0xff5533, specular: 0x111111, shininess: 200 });
            const mesh = new Mesh(geometry, material);
            mesh.scale.set(0.01, 0.01, 0.01);
            mesh.material.color.set('#ff5533');
            
            res(mesh);
        });
    })
}

function initDragControls(dragControls,transformControls,objects, camera, renderer, scene, controls) {
    //拖拽控件
    dragControls = new DragControls(objects, camera, renderer.domElement);
    // 开始拖拽
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false;
        console.log('dragstart');
    });
    // 拖拽结束
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true;
        transformControls.visible = false;
        console.log('dragend');
    });
    dragControls.addEventListener('hoveron', function (event) {
        console.log('hoveron');
        transformControls.visible = true;
        // 让变换控件对象和选中的对象绑定
        if (transformControls.visible) {
            transformControls.attach(event.object);
        }
    });
    transformControls.attach(objects[0]);
    scene.add(transformControls);
}
//创建线条
function createLine(p1,p2) {
    const geometry = new LineGeometry();
    geometry.setPositions([p1.x,p1.y,p1.z,p2.x,p2.y,p2.z]);
    let material = new LineMaterial({
        color: 0xff0000,
        // 线宽度
        linewidth: 3,
    });
    material.resolution.set(window.innerWidth, window.innerHeight);
    var line = new Line2(geometry, material);

    return line;
}

//物体中心点修改
function modelTranlate(geometry){
    var v3 = geometry.boundingBox.max;//x,y,z值基准点
    //这里基准点不是中心点，而是底面中心点
    console.log(v3);
    geometry.translate(-v3.x/2,0,-v3.z/2);
}

//线条更新
function lineUpdate(line,object1,object2){
    line.geometry.setPositions([
        object1.position.x,object1.position.y,object1.position.z,
        object2.position.x,object2.position.y,object2.position.z,
    ]);
}


function animateCamera(current1, target1, current2, target2, tween, camera, controls) {

    let positionVar = {
        x1: current1.x,
        y1: current1.y,
        z1: current1.z,
        x2: target1.x,
        y2: target1.y,
        z2: target1.z
    };
    //关闭控制器
    //controls.enabled = false;
    tween = new TWEEN.Tween(positionVar);
    tween.to({
        x1: current2.x,
        y1: current2.y,
        z1: current2.z,
        x2: target2.x,
        y2: target2.y,
        z2: target2.z
    }, 1000);

    tween.onUpdate(function () {
        camera.position.x = positionVar.x1;
        camera.position.y = positionVar.y1;
        camera.position.z = positionVar.z1;
        controls.target.x = positionVar.x2;
        controls.target.y = positionVar.y2;
        controls.target.z = positionVar.z2;
        controls.update();
    })
    tween.onComplete(function () {
        ///开启控制器
        controls.enabled = true;
    })
    tween.easing(TWEEN.Easing.Cubic.InOut);
    tween.start();
    return tween;
}


function tipShow(x, y, text) {
    var dom = document.getElementById('sprite');
    dom.style.visibility = 'visible';
    dom.style.top = (y - 16) + 'px';
    dom.style.left = x + 'px';
    dom.innerHTML = text;
}


function tipHide() {
    var dom = document.getElementById('sprite');
    dom.style.visibility = 'hidden';
}

function save(key, data) {
    window.localStorage.setItem(key, JSON.stringify(data));
}

export { loadSTLModel, initDragControls, animateCamera, createLine, tipHide, tipShow, save,lineUpdate }










