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
    Mesh
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
const TWEEN = require('@tweenjs/tween.js')
// 创建Three.js场景
const scene = new Scene();

//Object to store the size of the viewport
const size = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// 创建摄像机（用户的视角）。
const aspect = size.width / size.height;
const camera = new PerspectiveCamera(75, aspect);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

// 创建场景的灯光
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.target.position.set(-5, 0, 0);
scene.add(directionalLight);
scene.add(directionalLight.target);

// 设置渲染器，获取HTML的画布。
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({
    canvas: threeCanvas,
    alpha: true
});

renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 在场景中创建网格和坐标轴
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

// 创建轨道控制（用于导航场景）。
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);
var tween;
// 动画循环
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    if (tween) tween.update();
    requestAnimationFrame(animate);
};



animate();

// 根据浏览器的大小调整视口
window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

function cast(event) {

    // 计算鼠标在屏幕上的位置
    const bounds = threeCanvas.getBoundingClientRect();

    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    mouse.x = (x1 / x2) * 2 - 1;

    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    mouse.y = -(y1 / y2) * 2 + 1;

    // 将其放置在指向鼠标的相机上
    raycaster.setFromCamera(mouse, camera);

    // 投射射线
    return raycaster.intersectObjects(ifcModels);
}
const ifcModels = [];
// 创建子集材料
const preselectMat = new MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff88ff,
    depthTest: false
})

const geometry = new BufferGeometry();
geometry.setFromPoints([new Vector3(), new Vector3()]);
const line = new Line(geometry, new LineBasicMaterial());
scene.add(line);


function pick(event) {
    const found = cast(event)[0];
    if (found) {
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const ifc = ifcLoader.ifcManager;
        const id = ifc.getExpressId(geometry, index);
        // 创建子集
        let m = ifcLoader.ifcManager.createSubset({
            modelID: 0,
            ids: [id],
            material: preselectMat,
            scene: scene,
            removePrevious: true
        });
        console.log(found);
        console.log(ifcModels[0]);
        const p = found.point;//点击的点位

        //点击点所在的三角面的法向量
        const n = found.face.normal.clone();

        //向量所在模型变换方向
        n.transformDirection(ifcModels[0].matrixWorld);

        //向量拉长10倍
        n.multiplyScalar(10);

        //原点添加到其中
        n.add(found.point);

        //修改参考线的位置p原地，n向量拉长的点
        const positions = line.geometry.attributes.position;
        positions.setXYZ(0, p.x, p.y, p.z);
        positions.setXYZ(1, n.x, n.y, n.z);
        positions.needsUpdate = true;
        animateCamera(camera.position, controls.target, n, p);
        //camera.position.set(n.x, n.y, n.z);
        //camera.lookAt(p.x, p.y, p.z);
        if (stlMesh) {
            stlMesh.position.set(p.x, p.y, p.z);
            stlMesh.lookAt(n);
            stlMesh.rotateX(Math.PI / 2);
        }
    }
}

threeCanvas.ondblclick = pick;




// 设置IFC加载
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("../assets/");

async function loadIFC() {
    ifcLoader.load("../assets/model.ifc", (ifcModel) => {
        ifcModels.push(ifcModel);
        scene.add(ifcModel);
    });
}
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
//加载STL文件
var stlMesh, objects = [];
function loadSTLModel() {
    var stlLoder = new STLLoader();
    stlLoder.load('assets/szc.STL', function (geometry) {
        const material = new MeshPhongMaterial({ color: 0xff5533, specular: 0x111111, shininess: 200 });
        const mesh = new Mesh(geometry, material);
        mesh.scale.set(0.01, 0.01, 0.01);
        scene.add(mesh);
        stlMesh = mesh;
        objects.push(mesh);
        initDragControls();
    });
}

loadIFC();
loadSTLModel();

function initDragControls() {
    //拖拽控件
    var dragControls = new DragControls(objects, camera, renderer.domElement);
    var transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls);
    
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
    // 开始拖拽
    transformControls.addEventListener('dragging-changed', function (event) {

        controls.enabled = !event.value;
    });
}




function animateCamera(current1, target1, current2, target2) {

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

}










