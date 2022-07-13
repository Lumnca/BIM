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
    MeshLambertMaterial
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";

import { IFCLoader } from "web-ifc-three/IFCLoader";

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

// 动画循环
const animate = () => {
    controls.update();
    renderer.render(scene, camera);
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
        })
        console.log(m);
        console.log("模型体积:"+ getArea(m).toFixed(2))
    }
}

threeCanvas.ondblclick = pick;


// 设置IFC加载
const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setWasmPath("../assets/");
const input = document.getElementById("file-input");
input.addEventListener(
    "change",
    (changed) => {
        const file = changed.target.files[0];
        var ifcURL = URL.createObjectURL(file);
        ifcLoader.load(
            ifcURL,
            (ifcModel) => {
                ifcModels.push(ifcModel);
                scene.add(ifcModel);
                const manager = ifcLoader.ifcManager;
                window.manager = manager;

            });
    },
    false
);


//三角形面积计算
function AreaOfTriangle(p1, p2, p3) {
    var v1 = new Vector3();
    var v2 = new Vector3();
    // 通过两个顶点坐标计算其中两条边构成的向量
    v1 = p1.clone().sub(p2);
    v2 = p1.clone().sub(p3);

    var v3 = new Vector3();
    // 三角形面积计算
    v3.crossVectors(v1, v2);
    var s = v3.length() / 2;
    return s
}


window.getArea = function (mesh) {
    // 声明一个变量表示几何体的表面积
    var area = 0.0;
    var indexes = mesh.geometry.index.array;
    var points = mesh.geometry.attributes.position.array;
    console.log(indexes.length + "个三角形！");
    // 遍历一个几何体的全部三角形geometry.faces，所有三角形面积累积就是几何体的表面积
    // 对于不规则曲面，细分程度越高，面积计算精度越高
    let wait = [];
    for (let i = 0; i < indexes.length; i++) {
        //三角形的对应顶点索引
        var a = points[indexes[i] * 3];
        var b = points[indexes[i] * 3 + 1];
        var c = points[indexes[i] * 3 + 2];
        //每3个点代表一个三角形
        if (wait.length < 3) {
            var p = new Vector3(a, b, c);
            wait.push(p);
        }
        else {
            area += AreaOfTriangle(wait[0], wait[1], wait[2]); //三角形Face3面积累计计算
            wait = [];
        }
    }
    return area;
}

















