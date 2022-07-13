import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    Raycaster,
    Vector2
} from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import {
    acceleratedRaycast,
    computeBoundsTree,
    disposeBoundsTree
} from 'three-mesh-bvh';
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
function pick(event) {
    const found = cast(event)[0];
    if (found) {
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const ifc = ifcLoader.ifcManager;
        //获取元素id
        const id = ifc.getExpressId(geometry, index);
        //获取元素属于实体类别
        console.log(ifc.getIfcType(0,id));

        //获取元素的属性信息
        ifc.getItemProperties(0,id).then(res=>{
            console.log(res);
        })
        //获取给定元素的类型属性。
        ifc.getTypeProperties(0,id).then(res=>{
            console.log(res);
        })
        //获取给定元素的属性集和数量集。
        ifc.getPropertySets(0,id).then(res=>{
            console.log(res);
        })

        //document.getElementById('tag').innerText = "ID:"+id;
    }
}

// 设置IFC加载
//Sets up the IFC loading
const ifcModels = [];
const ifcLoader = new IFCLoader();
//设置相对于你输出js文件的位置到web-ifc.wasm的位置定位
ifcLoader.ifcManager.setWasmPath("../assets/");
// Sets up optimized picking
ifcLoader.ifcManager.setupThreeMeshBVH(
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast);

threeCanvas.ondblclick = pick;

async function loadIFC() {
    ifcLoader.load("../assets/model.ifc", (ifcModel) => {
        ifcModels.push(ifcModel);
        //scene.add(ifcModel);
    });
}


loadIFC();

