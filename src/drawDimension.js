import * as THREE from '../node_modules/three/src/Three';
import { color } from './shared'

const lineMaterial = new THREE.LineBasicMaterial({
  linewidth: 2,
  color: color.dimension,
  opacity: 0.2,
  transparent: true,
})


const pointMaterial = new THREE.PointsMaterial({
  color: color.dimension,
  size: 4,
})


export async function drawDimension() {
  let selection = await this.awaitSelection({ point: 2 }, { point: 1, line: 1 })

  if (selection == null) return;





  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position',
      new THREE.Float32BufferAttribute(3 * 8, 3)
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





  let dist = 0
  let ptLineOrder;



  if (selection.every(e => e.userData.type == 'point')) {
    for (let i = 0; i < 3; i++) {
      dist += (selection[0].geometry.attributes.position.array[i] - selection[1].geometry.attributes.position.array[i]) ** 2
    }

    dist = Math.sqrt(dist)
  } else {
    ptLineOrder = selection[0].userData.type == 'point' ? [0, 1] : [1, 0]
    const ptArr = selection[ptLineOrder[0]].geometry.attributes.position.array
    const lineArr = selection[ptLineOrder[1]].geometry.attributes.position.array


    p1.set(lineArr[0], lineArr[1])
    p2.set(lineArr[3], lineArr[4])
    p3.set(ptArr[0], ptArr[1])
    dir = p2.clone().sub(p1).normalize()
    const hypx = p3.clone().sub(p1)
    proj = dir.multiplyScalar(hypx.dot(dir))
    perp = hypx.clone().sub(proj)

    dist = Math.sqrt(perp.x ** 2 + perp.y ** 2)

  }


  this.obj3d.children[1].add(line).add(point)

  const onMove = this._onMoveDimension(point, line)


  point.label = document.createElement('div');
  point.label.textContent = dist.toFixed(3);
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
    if (ptLineOrder) {
      this.constraints.set(++this.c_id, //???
        [
          'pt_line_distance', dist,
          [selection[ptLineOrder[0]].name, -1, selection[ptLineOrder[1]].name, -1]
        ]
      )
    } else {
      this.constraints.set(++this.c_id, //???
        [
          'pt_pt_distance', dist,
          [selection[0].name, selection[1].name, -1, -1]
        ]
      )
    }

    selection[0].userData.constraints.push(this.c_id)
    selection[1].userData.constraints.push(this.c_id)

    this.updateOtherBuffers()

    line.name = this.c_id
    line.userData.type = 'dimension'
    point.name = this.c_id
    point.userData.type = 'dimension'



    point.label.addEventListener('focus', this.updateDim(this.c_id))



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

const p1 = new THREE.Vector2()
const p1x = new THREE.Vector2()
const p2 = new THREE.Vector2()
const p3 = new THREE.Vector2()
let dir, hyp, proj, perp, p1e, p1eArr, p2e, p2eArr, ids, _p1, _p2, p3Arr
let mdpt, proj1, proj2, hyp1, hyp2, hypx
let dp1e, dp2e, dp12

export function updateDim(c_id) {
  return (ev_focus) => {
    const value = ev_focus.target.textContent
    document.addEventListener('keydown', (e) => {
      if (e.key == 'Enter') {
        e.preventDefault()
        const ent = this.constraints.get(c_id)
        ent[1] = parseFloat(ev_focus.target.textContent)
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



export function _onMoveDimension(point, line) {

  ids = line.userData.ids

  _p1 = this.obj3d.children[this.objIdx.get(ids[0])].geometry.attributes.position.array
  _p2 = this.obj3d.children[this.objIdx.get(ids[1])].geometry.attributes.position.array

  let loc;

  return (e) => {
    loc = this.getLocation(e)

    p3.set(loc.x, loc.y)

    update(
      line.geometry.attributes.position,
      point.geometry.attributes.position,
      _p1, _p2
    )

    console.log(hyp)
    point.userData.offset = hyp.toArray()

    sc.render()
  }
}


export function setDimLines() {

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

      point.label.addEventListener('focus', this.updateDim(this.c_id))
    }

    ids = dims[i].userData.ids

    _p1 = this.obj3d.children[this.objIdx.get(ids[0])].geometry.attributes.position.array
    _p2 = this.obj3d.children[this.objIdx.get(ids[1])].geometry.attributes.position.array


    const offset = dims[i + 1].userData.offset
    p3.set(_p2[0] + offset[0], _p2[1] + offset[1])



    update(
      dims[i].geometry.attributes.position,
      dims[i + 1].geometry.attributes.position,
      _p1,
      _p2
    )
  }

}

function update(linegeom, pointgeom, _p1, _p2) {

  if (_p1.length == _p2.length) {
    p1.set(_p1[0], _p1[1])
    p2.set(_p2[0], _p2[1])

    dir = p2.clone().sub(p1).normalize()
    hyp = p3.clone().sub(p2) // note that this value is used to calculate tag-p2 offset
    proj = dir.multiplyScalar(hyp.dot(dir))
    perp = hyp.clone().sub(proj)

    p1e = p1.clone().add(perp)
    p1eArr = p1e.toArray()
    p2e = p2.clone().add(perp)
    p2eArr = p2e.toArray()
    p3Arr = p3.toArray()

    dp1e = p1e.distanceToSquared(p3)
    dp2e = p2e.distanceToSquared(p3)
    dp12 = p1e.distanceToSquared(p2e)

    linegeom.array.set(p1.toArray(), 0)


  } else {
    if (_p1.length < _p2.length) {
      p1.set(_p2[0], _p2[1])
      p1x.set(_p2[3], _p2[4])
      p2.set(_p1[0], _p1[1])
    } else {
      p1.set(_p1[0], _p1[1])
      p1x.set(_p1[3], _p1[4])
      p2.set(_p2[0], _p2[1])
    }

    dir = p1x.clone().sub(p1)
    mdpt = p1.clone().addScaledVector(dir, 0.5)
    dir.normalize()

    hypx = p2.clone().sub(mdpt)
    proj = dir.multiplyScalar(hypx.dot(dir))

    perp = hypx.clone().sub(proj)
    dp12 = perp.lengthSq()

    perp.normalize()


    hyp1 = p3.clone().sub(mdpt)
    proj1 = perp.clone().multiplyScalar(hyp1.dot(perp))

    hyp = p3.clone().sub(p2) // note that this value is used to calculate tag-p2 offset
    proj2 = perp.clone().multiplyScalar(hyp.dot(perp))


    p1eArr = p3.clone().sub(proj1).toArray()
    p2eArr = p3.clone().sub(proj2).toArray()
    p3Arr = p3.toArray()

    dp1e = proj1.lengthSq()
    dp2e = proj2.lengthSq()

    linegeom.array.set(mdpt.toArray(), 0)

  }

  linegeom.array.set(p1eArr, 3)
  linegeom.array.set(p1eArr, 6)
  linegeom.array.set(p2eArr, 9)
  linegeom.array.set(p2eArr, 12)
  linegeom.array.set(p2.toArray(), 15)
  if (dp12 >= dp1e && dp12 >= dp2e) {
    linegeom.array.set(p3Arr, 18)
  } else {
    if (dp1e > dp2e) {
      linegeom.array.set(p2eArr, 18)
    } else {
      linegeom.array.set(p1eArr, 18)
    }
  }
  linegeom.array.set(p3Arr, 21)

  linegeom.needsUpdate = true;

  pointgeom.array.set(p3Arr)
  pointgeom.needsUpdate = true;


}


