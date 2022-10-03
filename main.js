class vec3d {
    constructor(x = 0, y = x, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

class triangle {
    constructor(p1 = new vec3d, p2 = new vec3d, p3 = new vec3d) {
        this.p = [p1, p2, p3];
    }
}

class mesh {
    constructor(...tri) {
        this.tris = new Array();
        for(let i = 0; i < tri.length; i++) {
            this.tris.push(tri[i]);
        }
    }
    triCount() {
        return this.tris.length;
    }
    purge() {
        this.tris = new Array();
    }
}

class mat4x4 {
    constructor(val = 0) {
        this.m = new Array(4);
        for(let i = 0; i < this.m.length; i++) {
            this.m[i] = [val, val, val, val];
        }
    }
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// The 3D Object
var meshPoints = [
    new vec3d(0.0, 0.0, 0.0), // 0 back-buttom-left
    new vec3d(0.0, 0.0, 1.0), // 1 front-bottom-left
    new vec3d(0.0, 1.0, 0.0), // 2 back-top-left
    new vec3d(0.0, 1.0, 1.0), // 3 front-top-left
    new vec3d(1.0, 0.0, 0.0), // 4 back-bottom-right
    new vec3d(1.0, 0.0, 1.0), // 5 front-bottom-right
    new vec3d(1.0, 1.0, 0.0), // 6 back-top-right
    new vec3d(1.0, 1.0, 1.0)  // 7 front-top-right
];
var currentMesh = new mesh(
    // Back
    new triangle(meshPoints[0], meshPoints[2], meshPoints[6]),
    new triangle(meshPoints[0], meshPoints[6], meshPoints[4]),
    // Top
    new triangle(meshPoints[2], meshPoints[3], meshPoints[7]),
    new triangle(meshPoints[2], meshPoints[7], meshPoints[6]),
    // Front
    new triangle(meshPoints[5], meshPoints[7], meshPoints[3]),
    new triangle(meshPoints[5], meshPoints[3], meshPoints[1]),
    // Bottom
    new triangle(meshPoints[1], meshPoints[0], meshPoints[4]),
    new triangle(meshPoints[1], meshPoints[4], meshPoints[5]),
    // Left
    new triangle(meshPoints[1], meshPoints[3], meshPoints[2]),
    new triangle(meshPoints[1], meshPoints[2], meshPoints[0]),
    // Right
    new triangle(meshPoints[4], meshPoints[6], meshPoints[7]),
    new triangle(meshPoints[4], meshPoints[7], meshPoints[5]),
);


// Variables
var fNear;
var fFar;
var fFov;
// TODO Add to window resize event
var fAspectRatio;

// Timing variable
var totalTime = 0;

// Matrices
var matProj = new mat4x4;

// Utility functions
function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function normalized(v) {
    let mag = magnitude(v);
    if (mag != 0) {
        return new vec3d(v.x / mag, v.y / mag, v.z / mag);
    }
    return v;
}

function addVectors(v1, v2) {
    return new vec3d(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function subVectors(v1, v2) {
    return new vec3d(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function mulVector(v, s) {
    return new vec3d(v.x * s, v.y * s, v.z * s);
}

function divVector(v, s) {
    return new vec3d(v.x / s, v.y / s, v.z / s);
}

function dotProduct(v1, v2) {
    let nv1 = normalized(v1);
    let nv2 = normalized(v2);
    return nv1.x * nv2.x + nv1.y * nv2.y + nv1.z * nv2.z;
}

function crossProduct(v1, v2) {
    let result = new vec3d;
    result.x = v1.y * v2.z - v1.z * v2.y;
    result.y = v1.z * v2.x - v1.x * v2.z;
    result.z = v1.x * v2.y - v1.y * v2.x;

    result = normalized(result);

    return result;
}

function matrixMulVector(v, m) {
    let result = new vec3d;
    result.x = v.x * m.m[0][0] + v.y * m.m[1][0] + v.z * m.m[2][0] + v.w * m.m[3][0];
    result.y = v.x * m.m[0][1] + v.y * m.m[1][1] + v.z * m.m[2][1] + v.w * m.m[3][1];
    result.z = v.x * m.m[0][2] + v.y * m.m[1][2] + v.z * m.m[2][2] + v.w * m.m[3][2];
    result.w = v.x * m.m[0][3] + v.y * m.m[1][3] + v.z * m.m[2][3] + v.w * m.m[3][3];
    return result;
}

function matrixIdentity() {
    let result = new mat4x4;
    result.m[0][0] = 1;
    result.m[1][1] = 1;
    result.m[2][2] = 1;
    result.m[3][3] = 1;
    return result;
}

function matrixMakeRotationX(radAngle) {
    let result = new mat4x4;
    result.m[0][0] = 1;
    result.m[1][1] = Math.cos(radAngle * 0.5);
    result.m[1][2] = Math.sin(radAngle * 0.5);
    result.m[2][1] = -(Math.sin(radAngle * 0.5));
    result.m[2][2] = Math.cos(radAngle * 0.5);
    result.m[3][3] = 1;
    return result;
}

function matrixMakeRotationY(radAngle) {
    let result = new mat4x4;
    result.m[0][0] = Math.cos(radAngle);
    result.m[0][2] = Math.sin(radAngle);
    result.m[2][0] = -(Math.sin(radAngle));
    result.m[1][1] = 1;
    result.m[2][2] = Math.cos(radAngle);
    result.m[3][3] = 1;
    return result;
}

function matrixMakeRotationZ(radAngle) {
    let result = new mat4x4;
    result.m[0][0] = Math.cos(radAngle);
    result.m[0][1] = Math.sin(radAngle);
    result.m[1][0] = -(Math.sin(radAngle));
    result.m[1][1] = Math.cos(radAngle);
    result.m[2][2] = 1;
    result.m[3][3] = 1;
    return result;
}

function matrixMakeTranslation(x, y, z) {
    let result = matrixIdentity();
    result.m[3][0] = x;
    result.m[3][1] = y;
    result.m[3][2] = z;
    return result;
}

function matrixMakeProjection(fovDeg, aspectRatio, nearDist, farDist) {
    let fov = 1 / Math.tan(fovDeg * 0.5 / 180 * Math.PI);
    let result = new mat4x4;
    result.m[0][0] = aspectRatio * fov;
    result.m[1][1] = fov;
    result.m[2][2] = farDist / (farDist - nearDist);
    result.m[2][3] = 1;
    result.m[3][2] = (-farDist * nearDist) / (farDist - nearDist);
    result.m[3][3] = 0;
    return result;
}

function matrixMulMatrix(m1, m2) {
    let result = new mat4x4;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result.m[j][i] = m1.m[j][0] * m2.m[0][i] + m1.m[j][1] * m2.m[1][i] +
                             m1.m[j][2] * m2.m[2][i] + m1.m[j][3] * m2.m[3][i];
        }
    }
    return result;
}

function mulVec3ByMat4(v, m) {
    let result = new vec3d;

    result.x = v.x * m.m[0][0] + v.y * m.m[1][0] + v.z * m.m[2][0] + m.m[3][0];
    result.y = v.x * m.m[0][1] + v.y * m.m[1][1] + v.z * m.m[2][1] + m.m[3][1];
    result.z = v.x * m.m[0][2] + v.y * m.m[1][2] + v.z * m.m[2][2] + m.m[3][2];
    let w    = v.x * m.m[0][3] + v.y * m.m[1][3] + v.z * m.m[2][3] + m.m[3][3];

    if (w != 0) {
        result.x /= w; result.y /= w; result.z /= w;
    }

    return result;
}

function sort(arr, test = (l, r)=>{ if (l > r) { return true; } return false;}) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < (arr.length - i - 1); j++) {
            if (test(arr[j], arr[j + 1])) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

// Drawing functions
function drawLines(t) {
    ctx.beginPath();
    ctx.moveTo(t.p[0].x, t.p[0].y);
    ctx.lineTo(t.p[1].x, t.p[1].y);
    ctx.lineTo(t.p[2].x, t.p[2].y);
    ctx.closePath();
    ctx.stroke();
}

function drawTriangle(t) {
    ctx.beginPath();
    ctx.moveTo(t.p[0].x, t.p[0].y);
    ctx.lineTo(t.p[1].x, t.p[1].y);
    ctx.lineTo(t.p[2].x, t.p[2].y);
    ctx.closePath();
    ctx.fill();
}

// Main functions
function Init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    fAspectRatio = canvas.height / canvas.width;
    matProj = matrixMakeProjection(fFov, fAspectRatio, fNear, fFar);
}

function OnUserCreate() {
    document.querySelector('title').text = "3D Render Engine";
    pastTime = new Date().getMilliseconds();
    fNear = 0.1;
    fFar = 1000;
    fFov = 90.0;
    matProj = matrixMakeProjection(fFov, fAspectRatio, fNear, fFar);
}

// Camera I dont think this will be permanent
let cameraPos = new vec3d(0), translateZ = 8;

function OnUserUpdate() {

    // Updateing time
    totalTime = new Date().getTime() / 1000;

    let matRotZ = matrixMakeRotationZ(totalTime);
    let matRotX = matrixMakeRotationX(totalTime);

    // New matrices 
    let matTrans = matrixMakeTranslation(0, 0, 16);
    let matWorld = matrixMulMatrix(matRotZ, matRotX);
    matWorld = matrixMulMatrix(matWorld, matTrans);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Line thickness of mesh
    ctx.lineWidth = 0;
    // Coloring of the mesh
    ctx.strokeStyle = 'black';

    let trisToDraw = [];
    for (let i = 0; i < currentMesh.triCount(); i++) {
        let triProjected = new triangle, triTranslated = new triangle, triRotatedZ = new triangle, triRotatedZX = new triangle;
        // Rotating in the z-axis
        triRotatedZ.p[0] = mulVec3ByMat4(currentMesh.tris[i].p[0], matRotZ);
        triRotatedZ.p[1] = mulVec3ByMat4(currentMesh.tris[i].p[1], matRotZ);
        triRotatedZ.p[2] = mulVec3ByMat4(currentMesh.tris[i].p[2], matRotZ);

        // Rotating in the x-axis
        triRotatedZX.p[0] = mulVec3ByMat4(triRotatedZ.p[0], matRotX);
        triRotatedZX.p[1] = mulVec3ByMat4(triRotatedZ.p[1], matRotX);
        triRotatedZX.p[2] = mulVec3ByMat4(triRotatedZ.p[2], matRotX);

        triTranslated = triRotatedZX;
        triTranslated.p[0].z = triRotatedZX.p[0].z + translateZ;
        triTranslated.p[1].z = triRotatedZX.p[1].z + translateZ;
        triTranslated.p[2].z = triRotatedZX.p[2].z + translateZ;

        // TODO Remove unseen faces
        let cross = new vec3d, line1 = new vec3d, line2 = new vec3d;
        line1 = subVectors(triTranslated.p[1], triTranslated.p[0]);
        line2 = subVectors(triTranslated.p[2], triTranslated.p[0]);
        cross = crossProduct(line1, line2);
        let dot = dotProduct(cross, subVectors(triTranslated.p[0], cameraPos));
        if (dot < 0) {
            // Projecting to 2D space
            triProjected.p[0] = mulVec3ByMat4(triTranslated.p[0], matProj);
            triProjected.p[1] = mulVec3ByMat4(triTranslated.p[1], matProj);
            triProjected.p[2] = mulVec3ByMat4(triTranslated.p[2], matProj);

            // Translating to center of viewport
            triProjected.p[0].x += 1; triProjected.p[0].y += 1;
            triProjected.p[1].x += 1; triProjected.p[1].y += 1;
            triProjected.p[2].x += 1; triProjected.p[2].y += 1;
            // Scale into view
            triProjected.p[0].x *= 0.5 * canvas.width;
            triProjected.p[0].y *= 0.5 * canvas.height;
            triProjected.p[1].x *= 0.5 * canvas.width;
            triProjected.p[1].y *= 0.5 * canvas.height;
            triProjected.p[2].x *= 0.5 * canvas.width;
            triProjected.p[2].y *= 0.5 * canvas.height;
            
            trisToDraw.push(triProjected);
        }
    }
    
    // Sorting(Painter's algorithm) the triangles to be drawn
    trisToDraw = sort(trisToDraw, (l, r)=>{
        let z1 = (l.p[0].z + l.p[1].z + l.p[2].z) / 3;
        let z2 = (r.p[0].z + r.p[1].z + r.p[2].z) / 3;
        return z1 < z2;
    });

    // Rasterising triangles to be drawn
    for (let i = 0; i < trisToDraw.length; i++) {
        // Coloring based on light amount
        let cross = new vec3d, line1 = new vec3d, line2 = new vec3d;
        line1 = subVectors(trisToDraw[i].p[1], trisToDraw[i].p[0]);
        line2 = subVectors(trisToDraw[i].p[2], trisToDraw[i].p[0]);
        cross = crossProduct(line1, line2);
        let lightDir = normalized(new vec3d(0, 0, -1));
        let lightAmt = dotProduct(cross, lightDir);
        ctx.fillStyle = 'rgb(' + ((255 * lightAmt)) + ', ' + ((255 * lightAmt)) + ', ' + ((255 * lightAmt)) + ')';

        drawLines(trisToDraw[i]);
        drawTriangle(trisToDraw[i]);
    }

    requestAnimationFrame(OnUserUpdate);
}
// Starting function
function Start() {
    Init();
    OnUserCreate();
    OnUserUpdate();
}

// Starting the rendering
Start();
// Handling resize events
window.addEventListener('resize', Init);

// File Handling Code
var objReader = new FileReader(), objData = [], meshFaces = [], faceCount;

function readFiles(files) {
    for (let i = 0; i < files.length; i++) {
        console.log('File "' + files.item(i).name + '" being processed...');
        let type = files.item(i).name.slice(-3);
        if (type == 'obj') {
            readObj(files.item(i));
        }
    }
}

function readObj(file) {
    objReader.onload = (ev)=>{
        meshPoints = new Array();
        objData = objReader.result.split('\n');
        // console.log(objData);
        faceCount = 0;
        for(let i = 0; i < objData.length; i++) {
            if (objData[i].charAt(0) == 'v') {
                let vecStr = objData[i].slice(1).trim().split(' ');
                // console.log(vecStr);
                meshPoints.push(new vec3d(Number(vecStr[0]), Number(vecStr[1]), Number(vecStr[2])));
            }
            if (objData[i].charAt(0) == 'f') {
                let f = objData[i].slice(1).trim().split(' ');
                faceCount++;
                meshFaces.push(new triangle(meshPoints[Number(f[0]) - 1], meshPoints[Number(f[1]) - 1], meshPoints[Number(f[2]) - 1]));
            }
        }
        loadAssets();
    }
    objReader.readAsBinaryString(file);
}

function loadAssets() {
    currentMesh.purge();
    for (let i = 0; i < faceCount; i++) {
        console.log(meshFaces[i]);
        currentMesh.tris.push(meshFaces[i]);
    }
}

// Temporary zoom code
window.addEventListener('keydown', (ev)=>{
    if (ev.key == '-') { translateZ++; }
    if (ev.key == '=' || ev.key == '+') { translateZ--; }
});
