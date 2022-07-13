import {
    AmbientLight,
    AxesHelper,
    BufferGeometry,
    DirectionalLight,
    GridHelper,
    Line,
    LineBasicMaterial,
    MeshLambertMaterial,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import { DragControls } from "three/examples/jsm/controls/dragcontrols";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/transformcontrols";

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

var tween,lineMove;

// 动画循环
const animate = () => {
    controls.update();
    if (tween) tween.update();
    renderer.render(scene, camera);
    if(lineMove){
        if(UI.lines.length>0){
            lineUpdate(UI.lines[0],UI.LJs[0],UI.LJs[1]);
        }
    }
    requestAnimationFrame(animate);
};

animate();

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

function castModel(event, models) {
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
    return raycaster.intersectObjects(models);
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
//scene.add(line);
//双击切换视角
function pick(event) {
    const found = cast(event)[0];
    if (found) {
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const ifc = ifcLoader.ifcManager;
        const id = ifc.getExpressId(geometry, index);
        const modelId = found.object.modelID;
        const p = found.point;//点击的点位
        //点击点所在的三角面的法向量
        const n = found.face.normal.clone();
        //向量所在模型变换方向
        n.transformDirection(ifcModels[modelId].matrixWorld);
        //向量拉长10倍
        n.multiplyScalar(10);
        //原点添加到其中
        n.add(found.point);
        //修改参考线的位置p原地，n向量拉长的点
        const positions = line.geometry.attributes.position;
        positions.setXYZ(0, p.x, p.y, p.z);
        positions.setXYZ(1, n.x, n.y, n.z);
        positions.needsUpdate = true;
        tween = animateCamera(camera.position, controls.target, n, p, tween, camera, controls);
    }
}
//单机事件
function click(event) {
    if (UI.canAddLj) {
        const found = cast(event)[0];
        if (found) {
            const p = found.point;
            const n = found.face.normal.clone();
            //向量所在模型变换方向
            n.transformDirection(ifcModels[found.object.modelID].matrixWorld);
            //向量拉长10倍
            n.multiplyScalar(10);
            //原点添加到其中
            n.add(found.point);
            console.log(p);
            if (UI.stl) {

                UI.stl.position.set(p.x, p.y, p.z);
                UI.stl.lookAt(n);//对齐视角
                UI.stl.rotateX(Math.PI / 2);//安装面调整
                UI.stl.cpoy = {
                    face: { x: n.x, y: n.y, z: n.z }
                }
                scene.add(UI.stl)
                UI.canAddLj = false;

                UI.saveLJ();
            }
        }
    }
    else if (UI.canAddLine) {
        const found = castModel(event, UI.LJs)[0];
        if (found) {
            UI.linePoints.push(found.object.position);
            if (UI.linePoints.length === 2) {
                let line = createLine(UI.linePoints[0],UI.linePoints[1]);
                scene.add(line);
                UI.lines.push(line);
                UI.linePoints = [];
                //UI.saveLine();
            }
            console.log("add");
        }
    }
}
function check(event) {
    if (UI.check) {
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
        let models = raycaster.intersectObjects(UI.LJs);
        if (models[0]) {
            tipShow(event.clientX, event.clientY, '设备名称：' + models[0].object.name +
                "<br/> uuid:" + models[0].object.uuid + "<br/>状态：运行中");
        }
        else {
            tipHide();
        }
    }
}
threeCanvas.ondblclick = pick;
threeCanvas.onclick = click;
threeCanvas.onmousemove = check;

/**
 *  loadSTLModel().then(mesh=>{
                scene.add(mesh);
            });
 */
// 根据浏览器的大小调整视口
window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
});
//================================================================================================
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { animateCamera, createLine, initDragControls, lineUpdate, loadSTLModel, save, tipHide, tipShow } from "./tool";

// 设置IFC加载
const ifcLoader = new IFCLoader();

//设置相对于你输出js文件的位置到web-ifc.wasm的位置定位
ifcLoader.ifcManager.setWasmPath("../assets/");

//const HOST = 'http://116.63.162.142:4211/';
const HOST = 'https://localhost:7215/';


//
var transformControls = new TransformControls(camera, renderer.domElement);
// 开始拖拽
transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value;
});
transformControls.visible = false;
scene.add(transformControls);

var dragControls = new DragControls([], camera, renderer.domElement);
dragControls.enabled = false;
//**
//UI***************
//

const UI = new Vue({
    el: '#ui',
    data() {
        return {
            fileName: '',
            length: 5,
            scale: 1,
            onload: false,
            canAddLj: false,
            stl: null,
            timer: -1,
            lastPoint: new Vector3(),
            LJs: [],
            check: false,
            linePoints: [],
            canAddLine: false,
            lines: [],
            tragcontrols: null,
            move : false
        }
    },
    methods: {
        saveLJ() {
            let data = [];
            this.LJs.forEach(e => {
                data.push({
                    position: e.position,
                    name: e.name,
                    face: e.cpoy.face
                });
            });
            save('_ljs' + this.fileName, data);
        },
        saveLine() {
            save('_lines' + this.fileName, this.lines);
        },
        start(v) {
            /*axios.post('https://localhost:7215/api/Ifc', data).then(res => {
                console.log(res);
                this.files.push(res.data);
            })*/
            this.laodIfc(this.fileName, 0);
            this.onload = true;
        },
        laodIfc(url, index) {
            if (index < this.length) {
                ifcLoader.load(HOST + url + "_" + (index + 1) + ".ifc", (ifcModel) => {
                    scene.add(ifcModel);
                    ifcModel.scale.set(this.scale, this.scale, this.scale);
                    this.laodIfc(url, index + 1);
                    ifcModels.push(ifcModel);
                });
            }
            else {
                let data = JSON.parse(localStorage.getItem('_ljs' + this.fileName));
                data.forEach(e => {
                    let p = e.position;
                    loadSTLModel().then(mesh => {
                        mesh.position.set(p.x, p.y, p.z);
                        mesh.name = e.name;
                        mesh.lookAt(new Vector3(e.face.x, e.face.y, e.face.z));
                        mesh.rotateX(Math.PI / 2);
                        scene.add(mesh);
                        this.LJs.push(mesh);
                    })
                });
            }
        },
        tragCheck() {
           
            transformControls.visible = !transformControls.visible;
            lineMove = transformControls.visible;
            if (transformControls.visible) {
                initDragControls(dragControls, transformControls, this.LJs, camera, renderer, scene, controls);
            }
            else{
                scene.remove(transformControls);
            }
        },
        addLJ() {
            this.canAddLj = true;
            loadSTLModel().then(mesh => {
                mesh.name = "零件" + (this.LJs.length + 1);
                this.stl = mesh;
                this.LJs.push(mesh);
            })
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                if (this.stl) {
                    if (this.stl.material.color.getHexString() == 'ff5533') {
                        this.stl.material.color.set('#00ff00');
                    }
                    else {
                        this.stl.material.color.set('#ff5533');
                    }
                }
            }, 1000);
        },
        disabled() {

        },
        delLJ(lj, i) {
            scene.remove(lj);
            if (this.LJs.splice(i, 1)) {
                this.saveLJ();
            }
        },
        delLine(line, i) {
            scene.remove(line);
            if (this.lines.splice(i, 1)) {
                //this.saveLJ();
            }
        },
        startCheck() {
            this.check = true;
        },
        addLine() {
            this.canAddLine = !this.canAddLine;
            this.linePoints = [];
        }
    },
})
window.UI = UI;