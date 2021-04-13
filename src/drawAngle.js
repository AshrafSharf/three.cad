import * as THREE from '../node_modules/three/src/Three';
import { color } from './shared'

const lineMaterial = new THREE.LineBasicMaterial({
  linewidth: 2,
  color: color.dimension,
})


const pointMaterial = new THREE.PointsMaterial({
  color: color.dimension,
  size: 4,
})





const divisions = 12

export async function drawAngle() {
  let selection = await this.awaitSelection({ line: 2 })

  if (selection == null) return;

  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position',
      new THREE.Float32BufferAttribute(Array((divisions + 2) * 2 * 3).fill(-0.001), 3)
    ),
    lineMaterial.clone()
  );

  const point = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position',
      new THREE.Float32BufferAttribute(3, 3)
    ),
    pointMaterial.clone()
  )

  line.userData.ids = selection.map(e => e.name)

  line.layers.enable(2)
  point.layers.enable(2)

  let angle = getAngle(selection)


  this.obj3d.children[1].add(line).add(point)

  const onMove = this._onMoveAngle(point, line)

  point.label = document.createElement('div');
  point.label.textContent = angle.toFixed(3);
  point.label.contentEditable = true;
  this.labelContainer.append(point.label)

  let onEnd, onKey;
  let add = await new Promise((res) => {
    onEnd = (e) => res(true)
    onKey = (e) => e.key == 'Escape' && res(false)

    this.canvas.addEventListener('pointermove', onMove)
    this.canvas.addEventListener('pointerdown', onEnd)
    window.addEventListener('keydown', onKey)
  })

  this.canvas.removeEventListener('pointermove', onMove)
  this.canvas.removeEventListener('pointerdown', onEnd)
  window.removeEventListener('keydown', onKey)
  point.geometry.computeBoundingSphere()
  line.geometry.computeBoundingSphere()

  if (add) {

    this.constraints.set(++this.c_id,
      [
        'angle', angle,
        [-1, -1, selection[0].name, selection[1].name]
      ]
    )

    selection[0].userData.constraints.push(this.c_id)
    selection[1].userData.constraints.push(this.c_id)

    this.updateOtherBuffers()

    line.name = this.c_id
    line.userData.type = 'dimension'
    point.name = this.c_id
    point.userData.type = 'dimension'

    point.label.addEventListener('focus', this.updateAng(this.c_id))

  } else {

    this.obj3d.children[1].children.splice(this.obj3d.children[1].length - 2, 2).forEach(
      e => {
        e.geometry.dispose()
        e.material.dispose()
      }
    )
    this.labelContainer.removeChild(this.labelContainer.lastChild);
    sc.render()
  }

  return
}



export function updateAng(c_id) {
  return (ev_focus) => {
    let value = ev_focus.target.textContent
    document.addEventListener('keydown', (e) => {
      if (e.key == 'Enter') {
        e.preventDefault()
        const ent = this.constraints.get(c_id)
        ent[1] = parseFloat(ev_focus.target.textContent)
        value = ent[1]
        this.constraints.set(c_id, ent)
        this.updateOtherBuffers()
        this.solve()
        sc.render()
        ev_focus.target.blur()
        this.updateBoundingSpheres()
      } else if (e.key == 'Escape') {
        ev_focus.target.textContent = value
        getSelection().empty()
        ev_focus.target.blur()
      }
    })
  }
}


let ids, _l1, _l2
export function _onMoveAngle(point, line) {

  ids = line.userData.ids

  _l1 = this.obj3d.children[this.objIdx.get(ids[0])].geometry.attributes.position.array
  _l2 = this.obj3d.children[this.objIdx.get(ids[1])].geometry.attributes.position.array

  let loc;

  return (e) => {
    loc = this.getLocation(e)

    p3.set(loc.x, loc.y)

    update(
      line.geometry.attributes.position,
      point.geometry.attributes.position,
      _l1, _l2
    )

    // point.userData.offset = tagOffset.toArray() // save offset vector from center
    point.userData.offset = tagOffset // save offset vector from center
    // tagOffset = undefined

    sc.render()
  }
}


export function setAngLines() {

  const restoreLabels = this.labelContainer.childElementCount == 0;

  const dims = this.obj3d.children[1].children

  let point, dist;
  for (let i = 0; i < dims.length; i += 2) {
    if (restoreLabels) {
      point = dims[i + 1]  // point node is at i+1
      dist = this.constraints.get(point.name)[1]
      point.label = document.createElement('div');
      point.label.textContent = dist.toFixed(3);
      point.label.contentEditable = true;
      this.labelContainer.append(point.label)

      point.label.addEventListener('focus', this.updateAng(this.c_id))
    }

    ids = dims[i].userData.ids

    _l1 = this.obj3d.children[this.objIdx.get(ids[0])].geometry.attributes.position.array
    _l2 = this.obj3d.children[this.objIdx.get(ids[1])].geometry.attributes.position.array


    tagOffset = dims[i + 1].userData.offset



    update(
      dims[i].geometry.attributes.position,
      dims[i + 1].geometry.attributes.position,
      _l1,
      _l2
    )
  }

}



export function findIntersection(q, s, p, r) {
  /*
    Based on: https://stackoverflow.com/questions/563198/

    q+s  p+r
      \/__________ q+u*s
      /\  
     /  \
    p    q
    
    u = (q − p) × r / (r × s)
    when r × s = 0, the lines are either colinear or parallel

    function returns u
    for "real" intersection to exist, 0<u<1
  */
  const q_minus_p = q.clone().sub(p);
  const r_cross_s = r.cross(s);
  if (r_cross_s === 0) return null; //either colinear or parallel
  return q_minus_p.cross(r) / r_cross_s;
}



/*
                        _l2:[x0,y0,z0,x1,y1,z1]
                        /
              p3:tag-""/-. 
  tagOffset[1]-->|        \
                 |__ .    _|__ _l1:[x0,y0,z0,x1,y1,z1]
  tagOffset[0]----^  ^--center

  vecArr = [
    0: _l1 origin
    1: _l1 disp
    2: _l2 origin
    3: _l2 disp
    4: center
    5: tag disp from center
  ]
*/

const vecArr = Array(6)
for (var i = 0; i < vecArr.length; i++) vecArr[i] = new THREE.Vector2();
const a = Array(3)
const p3 = new THREE.Vector2()
let tagOffset

const getAngle = (Obj3dLines) => {
  for (let i = 0; i < 2; i++) {
    const arr = Obj3dLines[i].geometry.attributes.position.array
    vecArr[2 * i].set(...arr.slice(0, 2))
    vecArr[2 * i + 1].set(arr[3] - arr[0], arr[4] - arr[1])
  }
  const a1 = Math.atan2(vecArr[1].y, vecArr[1].x)
  const a2 = Math.atan2(vecArr[3].y, vecArr[3].x)

  let deltaAngle = Math.abs(a2 - a1)
  if (deltaAngle > Math.PI) {
    deltaAngle = Math.PI * 2 - deltaAngle
  }
  return deltaAngle / Math.PI * 180
}

function update(linegeom, pointgeom, _l1, _l2) {

  let i = 0;
  for (; i < 4;) {
    const arr = i == 0 ? _l1 : _l2
    vecArr[i++].set(arr[0], arr[1])
    vecArr[i++].set(arr[3] - arr[0], arr[4] - arr[1])
  }

  const centerScalar = findIntersection(...vecArr.slice(0, 4))
  const center = vecArr[i++].addVectors(vecArr[0], vecArr[1].clone().multiplyScalar(centerScalar))

  // tagOffset = vecArr[i++].subVectors(p3, center)

  if (tagOffset === undefined) {
    tagOffset = vecArr[i++].subVectors(p3, center)
  // } else if (Array.isArray(tagOffset)) {
    // tagOffset = new THREE.Vector2(tagOffset[0],tagOffset[1])
    console.log('undefined')
  } else {
    console.log('tagdefined', tagOffset)
    p3.addVectors(center, tagOffset)
  }

  // console.log(p3, center, 'vr')
  // console.log(vecArr, 'vecArr')

  // console.log(tagOffset, xx)
  // console.log(tagOffset.length())
  const tagRadius = tagOffset.length()

  /*
    if tag is more than 90 deg away from midline, we shift everything by 180

    a: array that describes absolute angular position of angle start, angle end, and tag

       a[2]:      
        tag  a[1]:angle end
      \  |  /
       \ | /
     ___\|/___ a[0]+dA/2:midline
        / \
       /   \
      /     \
             a[0]:angle start 
  */

  for (let j = 1, i = 0; j < vecArr.length; j += 2, i++) {
    a[i] = Math.atan2(vecArr[j].y, vecArr[j].x)
  }

  let dA = unreflex(a[1] - a[0])


  let tagtoMidline = unreflex(a[2] - (a[0] + dA / 2))

  let shift = Math.abs(tagtoMidline) < Math.PI / 2 ? 0 : Math.PI;

  let tA1 = unreflex(a[2] - (a[0] + shift))
  let tA2 = unreflex(a[2] - (a[0] + dA + shift))


  let a1, deltaAngle;
  if (dA * tA1 < 0) {
    a1 = a[0] + tA1 + shift
    deltaAngle = dA - tA1
  } else if (dA * tA2 > 0) {
    a1 = a[0] + shift
    deltaAngle = dA + tA2
  } else {
    a1 = a[0] + shift
    deltaAngle = dA
  }

  let points = linegeom.array

  let d = 0;
  points[d++] = center.x + tagRadius * Math.cos(a1)
  points[d++] = center.y + tagRadius * Math.sin(a1)
  d++

  const angle = a1 + (1 / divisions) * deltaAngle
  points[d++] = center.x + tagRadius * Math.cos(angle)
  points[d++] = center.y + tagRadius * Math.sin(angle)
  d++

  for (i = 2; i <= divisions; i++) {
    points[d++] = points[d - 4]
    points[d++] = points[d - 4]
    d++
    const angle = a1 + (i / divisions) * deltaAngle
    points[d++] = center.x + tagRadius * Math.cos(angle)
    points[d++] = center.y + tagRadius * Math.sin(angle)
    d++
  }


  for (i = 0; i < 2; i++) {
    points[d++] = vecArr[2 * i].x
    points[d++] = vecArr[2 * i].y
    d++
    points[d++] = center.x + tagRadius * Math.cos(a[i] + shift)
    points[d++] = center.y + tagRadius * Math.sin(a[i] + shift)
    d++
  }

  linegeom.needsUpdate = true;

  pointgeom.array.set(p3.toArray())
  pointgeom.needsUpdate = true;


}


const twoPi = Math.PI * 2
const negTwoPi = - Math.PI * 2
const negPi = - Math.PI

function unreflex(angle) {
  if (angle > Math.PI) {
    angle = negTwoPi + angle
  } else if (angle < negPi) {
    angle = twoPi + angle
  }
  return angle
}